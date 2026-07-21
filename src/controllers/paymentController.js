import Stripe from 'stripe'
import { Op } from 'sequelize'

import sequelize from '../database/connection.js'
import Order from '../models/Order.js'
import OrderItem from '../models/OrderItem.js'
import Product from '../models/Product.js'
import ProductColor from '../models/ProductColor.js'
import ProductVariant from '../models/ProductVariant.js'

import {
  convertPriceToCents,
  createRequestError,
  groupQuantitiesByProduct,
  groupQuantitiesByVariant,
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
            Number(product.id),
            product,
          ])
        )

        /*
         * Carrega e bloqueia todas as variantes ativas
         * dos produtos presentes no carrinho.
         */
        const variants =
          await ProductVariant.findAll({
            where: {
              product_id: {
                [Op.in]: productIds,
              },
              active: true,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          })

        const variantsById = new Map(
          variants.map(variant => [
            Number(variant.id),
            variant,
          ])
        )

        const productsWithVariants = new Set(
          variants.map(variant =>
            Number(variant.product_id)
          )
        )

        /*
         * Produtos que possuem variantes exigem
         * uma variante válida no carrinho.
         */
        for (const item of requestedItems) {
          if (
            productsWithVariants.has(item.productId) &&
            !item.variantId
          ) {
            const product =
              productsById.get(item.productId)

            throw createRequestError(
              `Selecione uma opção para o produto "${product.name}"`
            )
          }

          if (item.variantId) {
            const variant =
              variantsById.get(item.variantId)

            if (
              !variant ||
              Number(variant.product_id) !==
                item.productId
            ) {
              throw createRequestError(
                'Uma ou mais variantes não estão disponíveis'
              )
            }
          }
        }

        const legacyItems =
          requestedItems.filter(
            item => !item.variantId
          )

        const quantitiesByProduct =
          groupQuantitiesByProduct(legacyItems)

        const quantitiesByVariant =
          groupQuantitiesByVariant(requestedItems)

        /*
         * Valida o estoque legado somente para
         * produtos que não possuem variantes.
         */
        for (
          const [productId, requestedQuantity]
          of quantitiesByProduct
        ) {
          const product = productsById.get(productId)

          if (
            requestedQuantity >
            Number(product.stock)
          ) {
            throw createRequestError(
              `Estoque insuficiente para o produto "${product.name}"`
            )
          }
        }

        /*
         * Valida o estoque agrupado por variante.
         */
        for (
          const [variantId, requestedQuantity]
          of quantitiesByVariant
        ) {
          const variant =
            variantsById.get(variantId)

          const product =
            productsById.get(
              Number(variant.product_id)
            )

          if (
            requestedQuantity >
            Number(variant.stock)
          ) {
            throw createRequestError(
              `Estoque insuficiente para a opção selecionada do produto "${product.name}"`
            )
          }
        }

        const colorIds = [
          ...new Set(
            variants
              .map(variant =>
                variant.product_color_id
              )
              .filter(Boolean)
              .map(Number)
          ),
        ]

        const colors =
          colorIds.length > 0
            ? await ProductColor.findAll({
                where: {
                  id: {
                    [Op.in]: colorIds,
                  },
                },
                transaction,
              })
            : []

        const colorsById = new Map(
          colors.map(color => [
            Number(color.id),
            color,
          ])
        )

        const normalizedItems =
          requestedItems.map(item => {
            const product =
              productsById.get(item.productId)

            const variant = item.variantId
              ? variantsById.get(item.variantId)
              : null

            const variantPrice =
              variant?.price_override

            const price =
              variantPrice !== null &&
              variantPrice !== undefined
                ? variantPrice
                : product.price

            const unitPriceCents =
              convertPriceToCents(
                price,
                product.name
              )

            const color = variant?.product_color_id
              ? colorsById.get(
                  Number(
                    variant.product_color_id
                  )
                )
              : null

            return {
              productId: product.id,
              variantId: variant?.id || null,
              quantity: item.quantity,
              selectedSize:
                variant?.size ||
                item.selectedSize ||
                null,
              sku: variant?.sku || null,
              color: color?.name || null,
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
            product_variant_id: item.variantId,
            quantity: item.quantity,
            price: item.unitPriceCents / 100,
            size: item.selectedSize,
            sku: item.sku,
            color: item.color,
          })),
          {
            transaction,
          }
        )

        /*
         * Reserva estoque das variantes.
         */
        for (
          const [variantId, requestedQuantity]
          of quantitiesByVariant
        ) {
          const variant =
            variantsById.get(variantId)

          await variant.update(
            {
              stock:
                Number(variant.stock) -
                requestedQuantity,
            },
            {
              transaction,
            }
          )
        }

        /*
         * Reserva estoque dos produtos legados.
         */
        for (
          const [productId, requestedQuantity]
          of quantitiesByProduct
        ) {
          const product =
            productsById.get(productId)

          await product.update(
            {
              stock:
                Number(product.stock) -
                requestedQuantity,
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
      .status(
        error.isRequestError
          ? error.statusCode
          : 500
      )
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