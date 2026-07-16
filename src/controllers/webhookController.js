import Stripe from 'stripe'

import sequelize from '../database/connection.js'
import Order from '../models/Order.js'
import OrderItem from '../models/OrderItem.js'
import Product from '../models/Product.js'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
)

async function confirmOrder(paymentIntent) {
  await sequelize.transaction(
    async transaction => {
      const order = await Order.findOne({
        where: {
          payment_intent_id: paymentIntent.id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })

      if (!order) {
        console.warn(
          `Pedido não encontrado para o PaymentIntent ${paymentIntent.id}`
        )
        return
      }

      const expectedAmount = Math.round(
        Number(order.total) * 100
      )

      if (
        !Number.isSafeInteger(expectedAmount) ||
        paymentIntent.amount_received !== expectedAmount
      ) {
        throw new Error(
          `Valor divergente no pedido ${order.id}`
        )
      }

      if (order.status === 'confirmed') {
        return
      }

      if (order.status !== 'pending') {
        console.warn(
          `Pedido ${order.id} não pode ser confirmado com status ${order.status}`
        )
        return
      }

      await order.update(
        {
          status: 'confirmed',
        },
        {
          transaction,
        }
      )

      console.log(
        `✅ Pedido ${order.id} confirmado pelo webhook`
      )
    }
  )
}

async function cancelOrderAndRestoreStock(
  paymentIntent
) {
  await sequelize.transaction(
    async transaction => {
      const order = await Order.findOne({
        where: {
          payment_intent_id: paymentIntent.id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })

      if (!order) {
        console.warn(
          `Pedido não encontrado para o PaymentIntent ${paymentIntent.id}`
        )
        return
      }

      /*
       * Impede que o mesmo webhook devolva o estoque
       * mais de uma vez.
       */
      if (order.status === 'cancelled') {
        return
      }

      if (order.status !== 'pending') {
        console.warn(
          `Pedido ${order.id} não pode ser cancelado com status ${order.status}`
        )
        return
      }

      const orderItems = await OrderItem.findAll({
        where: {
          order_id: order.id,
        },
        transaction,
      })

      const quantitiesByProduct = new Map()

      for (const item of orderItems) {
        const currentQuantity =
          quantitiesByProduct.get(
            item.product_id
          ) || 0

        quantitiesByProduct.set(
          item.product_id,
          currentQuantity + item.quantity
        )
      }

      for (
        const [productId, quantity]
        of quantitiesByProduct
      ) {
        await Product.increment(
          {
            stock: quantity,
          },
          {
            where: {
              id: productId,
            },
            transaction,
          }
        )
      }

      await order.update(
        {
          status: 'cancelled',
        },
        {
          transaction,
        }
      )

      console.log(
        `↩️ Estoque restaurado para o pedido ${order.id}`
      )
    }
  )
}

export async function stripeWebhook(req, res) {
  const signature =
    req.headers['stripe-signature']

  if (!signature) {
    return res.status(400).json({
      error: 'Assinatura do Stripe não fornecida',
    })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error(
      'STRIPE_WEBHOOK_SECRET não configurado'
    )

    return res.status(500).json({
      error: 'Webhook não configurado',
    })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error(
      'Assinatura inválida do webhook:',
      error.message
    )

    return res.status(400).json({
      error: 'Assinatura inválida',
    })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await confirmOrder(event.data.object)
        break

      case 'payment_intent.canceled':
        await cancelOrderAndRestoreStock(
          event.data.object
        )
        break

      case 'payment_intent.payment_failed':
        console.warn(
          `Pagamento falhou: ${event.data.object.id}`
        )
        break

      default:
        console.log(
          `Evento Stripe ignorado: ${event.type}`
        )
    }

    return res.json({
      received: true,
    })
  } catch (error) {
    console.error(
      `Erro ao processar ${event.type}:`,
      error
    )

    return res.status(500).json({
      error: 'Erro ao processar webhook',
    })
  }
}