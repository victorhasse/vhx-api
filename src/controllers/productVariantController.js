import Product from '../models/Product.js'
import ProductColor from '../models/ProductColor.js'
import ProductVariant from '../models/ProductVariant.js'

import {
  normalizeSku,
  validateStock,
  normalizeOptionalPrice,
} from '../services/productCatalogService.js'

async function findProductColor(productId, colorId) {
  if (colorId === null) {
    return null
  }

  return ProductColor.findOne({
    where: {
      id: colorId,
      product_id: productId,
      active: true,
    },
  })
}

export async function createVariant(req, res) {
  try {
    const productId = Number(req.params.productId)
    const {
      product_color_id,
      sku,
      size,
      stock = 0,
      price_override,
    } = req.body

    const colorId =
      product_color_id === undefined ||
      product_color_id === null ||
      product_color_id === ''
        ? null
        : Number(product_color_id)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: 'Produto inválido',
      })
    }

    if (
      colorId !== null &&
      (!Number.isInteger(colorId) || colorId <= 0)
    ) {
      return res.status(400).json({
        error: 'Cor inválida',
      })
    }

    const normalizedSku = normalizeSku(sku || '')

    if (!normalizedSku) {
      return res.status(400).json({
        error: 'SKU é obrigatório',
      })
    }

    if (!validateStock(stock)) {
      return res.status(400).json({
        error: 'Estoque deve ser um número inteiro positivo ou zero',
      })
    }

    const normalizedPrice =
      normalizeOptionalPrice(price_override)

    if (normalizedPrice === undefined) {
      return res.status(400).json({
        error: 'Preço da variante inválido',
      })
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        active: true,
      },
    })

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado',
      })
    }

    const color = await findProductColor(
      productId,
      colorId
    )

    if (colorId !== null && !color) {
      return res.status(404).json({
        error: 'Cor não encontrada para este produto',
      })
    }

    const variant = await ProductVariant.create({
      product_id: productId,
      product_color_id: colorId,
      sku: normalizedSku,
      size: 
        size === undefined || size === null
          ? null
          : String(size).trim() || null,
      stock: Number(stock),
      price_override: normalizedPrice,
      active: true,
    })

    const createdVariant =
      await ProductVariant.findByPk(variant.id, {
        include: [
          {
            model: ProductColor,
            as: 'color',
            required: false,
          },
        ],
      })

    return res.status(201).json(createdVariant)
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Já existe uma variante com este SKU',
      })
    }

    console.error('Erro ao criar variante:', error)

    return res.status(500).json({
      error: 'Não foi possível criar a variante',
    })
  }
}

export async function updateVariant(req, res) {
  try {
    const productId = Number(req.params.productId)
    const variantId = Number(req.params.variantId)
    const {
      product_color_id,
      sku,
      size,
      stock,
      price_override,
      active,
    } = req.body

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(variantId)
    ) {
      return res.status(400).json({
        error: 'Produto ou variante inválidos',
      })
    }

    const variant = await ProductVariant.findOne({
      where: {
        id: variantId,
        product_id: productId,
      },
    })

    if (!variant) {
      return res.status(404).json({
        error: 'Variante não encontrada',
      })
    }

    const changes = {}

    if (product_color_id !== undefined) {
      const colorId =
        product_color_id === null ||
        product_color_id === ''
          ? null
          : Number(product_color_id)

      if (
        colorId !== null &&
        (!Number.isInteger(colorId) || colorId <= 0)
      ) {
        return res.status(400).json({
          error: 'Cor inválida',
        })
      }

      const color = await findProductColor(
        productId,
        colorId
      )

      if (colorId !== null && !color) {
        return res.status(404).json({
          error: 'Cor não encontrada para este produto',
        })
      }

      changes.product_color_id = colorId
    }

    if (sku !== undefined) {
      const normalizedSku = normalizeSku(sku)

      if (!normalizedSku) {
        return res.status(400).json({
          error: 'SKU é obrigatório',
        })
      }

      changes.sku = normalizedSku
    }

    if (size !== undefined) {
      changes.size = String(size).trim() || null
    }

    if (stock !== undefined) {
      if (!validateStock(stock)) {
        return res.status(400).json({
          error: 'Estoque deve ser um número inteiro positivo ou zero',
        })
      }

      changes.stock = Number(stock)
    }

    if (price_override !== undefined) {
      const normalizedPrice =
        normalizeOptionalPrice(price_override)

      if (normalizedPrice === undefined) {
        return res.status(400).json({
          error: 'Preço da variante inválido',
        })
      }

      changes.price_override = normalizedPrice
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return res.status(400).json({
          error: 'O campo active deve ser booleano',
        })
      }

      changes.active = active
    }

    await variant.update(changes)

    const updatedVariant =
      await ProductVariant.findByPk(variant.id, {
        include: [
          {
            model: ProductColor,
            as: 'color',
            required: false,
          },
        ],
      })

    return res.json(updatedVariant)
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Já existe uma variante com este SKU',
      })
    }

    console.error('Erro ao atualizar variante:', error)

    return res.status(500).json({
      error: 'Não foi possível atualizar a variante',
    })
  }
}

export async function removeVariant(req, res) {
  try {
    const productId = Number(req.params.productId)
    const variantId = Number(req.params.variantId)

    const variant = await ProductVariant.findOne({
      where: {
        id: variantId,
        product_id: productId,
      },
    })

    if (!variant) {
      return res.status(404).json({
        error: 'Variante não encontrada',
      })
    }

    await variant.update({
      active: false,
    })

    return res.json({
      message: 'Variante desativada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao remover variante:', error)

    return res.status(500).json({
      error: 'Não foi possível remover a variante',
    })
  }
}