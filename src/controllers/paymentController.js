import Stripe from 'stripe'
import { Op } from 'sequelize'

import sequelize from '../database/connection.js'
import Order from '../models/Order.js'
import OrderItem from '../models/OrderItem.js'
import Product from '../models/Product.js'

import {
  convertPriceToCents,
  createRequestError,
  groupQuantitiesByProduct,
  normalizeRequestedItems,
} from '../services/checkoutService.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function createPaymentIntent(req, res) {
  let paymentIntent = null

  try {
    const { items, address } = req.body
    const userId = req.user.id

    const requestedItems =
      normalizeRequestedItems(items)

    const productIds = [
      ...new Set(
        requestedItems.map(item => item.productId)
      ),
    ]

    const result = await sequelize.transaction(
      async transaction => {
        /*
         * Bloqueia os produtos durante a transação.
         * Isso reduz o risco de duas compras utilizarem
         * o mesmo estoque ao mesmo tempo.
         */
        const products = await Product.findAll({
          where: {
            id: {
              [Op.in]: productIds,
            },
            active: true,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        })

        if (products.length !== productIds.length) {
          throw createRequestError(
            'Um ou mais produtos não estão disponíveis'
          )
        }

        const productsById = new Map(
          products.map(product => [
            product.id,
            product,
          ])
        )

        const quantitiesByProduct =
          groupQuantitiesByProduct(requestedItems)

        for (
          const [productId, requestedQuantity]
          of quantitiesByProduct
        ) {
          const product = productsById.get(productId)

          if (requestedQuantity > product.stock) {
            throw createRequestError(
              `Estoque insuficiente para o produto "${product.name}"`
            )
          }
        }

        const normalizedItems =
          requestedItems.map(item => {
            const product =
              productsById.get(item.productId)

            const unitPriceCents = convertPriceToCents(
              product.price,
              product.name
            )

            return {
              productId: product.id,
              quantity: item.quantity,
              selectedSize: item.selectedSize,
              unitPriceCents,
              subtotalCents:
                unitPriceCents * item.quantity,
            }
          })

        const totalCents = normalizedItems.reduce(
          (total, item) =>
            total + item.subtotalCents,
          0
        )

        if (
          !Number.isSafeInteger(totalCents) ||
          totalCents <= 0
        ) {
          throw createRequestError(
            'Valor total do pedido inválido'
          )
        }

        const order = await Order.create(
          {
            user_id: userId,
            total: totalCents / 100,
            status: 'pending',
            address: JSON.stringify(address),
          },
          {
            transaction,
          }
        )

        await OrderItem.bulkCreate(
          normalizedItems.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.unitPriceCents / 100,
            size: item.selectedSize,
          })),
          {
            transaction,
          }
        )

        /*
         * Reserva o estoque antes de liberar
         * a transação.
         */
        for (
          const [productId, requestedQuantity]
          of quantitiesByProduct
        ) {
          const product = productsById.get(productId)

          await product.update(
            {
              stock:
                product.stock - requestedQuantity,
            },
            {
              transaction,
            }
          )
        }

        paymentIntent =
          await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'brl',
            metadata: {
              user_id: String(userId),
              order_id: String(order.id),
            },
          })

        await order.update(
          {
            payment_intent_id: paymentIntent.id,
          },
          {
            transaction,
          }
        )

        return {
          clientSecret:
            paymentIntent.client_secret,
          orderId: order.id,
          total: totalCents / 100,
        }
      }
    )

    return res.status(201).json(result)
  } catch (error) {
    /*
     * Se o PaymentIntent foi criado, mas a transação
     * do banco falhou, tentamos cancelá-lo no Stripe.
     */
    if (paymentIntent?.id) {
      try {
        await stripe.paymentIntents.cancel(
          paymentIntent.id
        )
      } catch (stripeError) {
        console.error(
          'Não foi possível cancelar o PaymentIntent:',
          stripeError.message
        )
      }
    }

    console.error(
      'Erro ao criar pagamento:',
      error
    )

    return res
      .status(error.isRequestError ? error.statusCode : 500)
      .json({
        error:
          error.isRequestError
            ? error.message
            : 'Não foi possível iniciar o pagamento',
      })
  }
}

export async function confirmPayment(req, res) {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({
        error: 'Pedido não informado',
      })
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        user_id: req.user.id,
      },
    })

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
      })
    }

    if (!order.payment_intent_id) {
      return res.status(400).json({
        error: 'Pagamento não vinculado ao pedido',
      })
    }

    /*
     * Confere diretamente no Stripe se o pagamento
     * realmente foi concluído.
     */
    const paymentIntent =
      await stripe.paymentIntents.retrieve(
        order.payment_intent_id
      )

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'O pagamento ainda não foi confirmado',
      })
    }

    if (order.status !== 'confirmed') {
      await order.update({
        status: 'confirmed',
      })
    }

    return res.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error(
      'Erro ao confirmar pagamento:',
      error
    )

    return res.status(500).json({
      error: 'Não foi possível confirmar o pagamento',
    })
  }
}

export async function cancelPayment(req, res) {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({
        error: 'Pedido não informado',
      })
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        user_id: req.user.id,
      },
    })

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
      })
    }

    if (!order.payment_intent_id) {
      return res.status(400).json({
        error: 'Pagamento não vinculado ao pedido',
      })
    }

    if (order.status === 'confirmed') {
      return res.status(409).json({
        error:
          'Um pedido confirmado não pode ser cancelado por esta operação',
      })
    }

    if (order.status === 'cancelled') {
      return res.json({
        success: true,
        order,
      })
    }

    const paymentIntent =
      await stripe.paymentIntents.retrieve(
        order.payment_intent_id
      )

    if (paymentIntent.status === 'succeeded') {
      return res.status(409).json({
        error:
          'O pagamento já foi concluído',
      })
    }

    if (paymentIntent.status !== 'canceled') {
      await stripe.paymentIntents.cancel(
        paymentIntent.id
      )
    }

    /*
     * O webhook payment_intent.canceled
     * atualizará o pedido e devolverá o estoque.
     */
    return res.json({
      success: true,
      message:
        'Cancelamento solicitado ao Stripe',
    })
  } catch (error) {
    console.error(
      'Erro ao cancelar pagamento:',
      error
    )

    return res.status(500).json({
      error:
        'Não foi possível cancelar o pagamento',
    })
  }
}