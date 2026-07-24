import {
  Op,
} from 'sequelize'

import Product from '../models/Product.js'
import ProductVariant from '../models/ProductVariant.js'

import {
  convertPriceToCents,
  createRequestError,
  normalizeRequestedItems,
} from '../services/checkoutService.js'

import {
  buildShippingPayload,
  requestShippingQuote,
} from '../services/shippingService.js'

export async function quoteShipping(req, res) {
  try {
    const {
      destinationPostalCode,
      items,
    } = req.body

    const requestedItems =
      normalizeRequestedItems(items)

    const productIds = [
      ...new Set(
        requestedItems.map(
          item => item.productId
        )
      ),
    ]

    const products = await Product.findAll({
      where: {
        id: {
          [Op.in]: productIds,
        },
        active: true,
      },
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

    const variants =
      await ProductVariant.findAll({
        where: {
          product_id: {
            [Op.in]: productIds,
          },
          active: true,
        },
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

    const shippingItems =
      requestedItems.map(item => {
        const product =
          productsById.get(item.productId)

        if (
          productsWithVariants.has(
            item.productId
          ) &&
          !item.variantId
        ) {
          throw createRequestError(
            `Selecione uma opção para o produto "${product.name}"`
          )
        }

        const variant = item.variantId
          ? variantsById.get(item.variantId)
          : null

        if (
          item.variantId &&
          (
            !variant ||
            Number(variant.product_id) !==
              item.productId
          )
        ) {
          throw createRequestError(
            'Uma ou mais variantes não estão disponíveis'
          )
        }

        const price =
          variant?.price_override !== null &&
          variant?.price_override !== undefined
            ? variant.price_override
            : product.price

        const priceCents =
          convertPriceToCents(
            price,
            product.name
          )

        return {
          ...item,
          insuranceValue:
            priceCents / 100,
        }
      })

    const payload = buildShippingPayload({
      destinationPostalCode,
      requestedItems: shippingItems,
      productsById,
    })

    const options =
      await requestShippingQuote(payload)

    return res.json({
      destinationPostalCode:
        payload.to.postal_code,
      options,
    })
  } catch (error) {
    console.error(
      'Erro ao calcular frete:',
      error
    )

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.isRequestError
          ? error.message
          : 'Erro interno ao calcular frete',
    })
  }
}