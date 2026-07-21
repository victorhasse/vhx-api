import sequelize from '../database/connection.js'
import Product from '../models/Product.js'
import ProductColor from '../models/ProductColor.js'
import ProductImage from '../models/ProductImage.js'

import {
  isValidImageUrl,
} from '../services/productCatalogService.js'

async function findProductAndColor(
  productId,
  colorId,
  transaction
) {
  const product = await Product.findOne({
    where: {
      id: productId,
      active: true,
    },
    transaction,
  })

  if (!product) {
    return {
      error: 'Produto não encontrado',
      statusCode: 404,
    }
  }

  if (colorId === null) {
    return {
      product,
      color: null,
    }
  }

  const color = await ProductColor.findOne({
    where: {
      id: colorId,
      product_id: productId,
      active: true,
    },
    transaction,
  })

  if (!color) {
    return {
      error: 'Cor não encontrada para este produto',
      statusCode: 404,
    }
  }

  return {
    product,
    color,
  }
}

export async function createImage(req, res) {
  try {
    const productId = Number(req.params.productId)
    const {
      product_color_id,
      image_url,
      alt_text,
      sort_order = 0,
      is_primary = false,
    } = req.body

    const colorId =
      product_color_id === null ||
      product_color_id === undefined
        ? null
        : Number(product_color_id)

    const sortOrder = Number(sort_order)

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

    if (!isValidImageUrl(image_url)) {
      return res.status(400).json({
        error: 'URL da imagem inválida',
      })
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return res.status(400).json({
        error: 'Ordem da imagem inválida',
      })
    }

    if (typeof is_primary !== 'boolean') {
      return res.status(400).json({
        error: 'O campo is_primary deve ser booleano',
      })
    }

    const image = await sequelize.transaction(
      async transaction => {
        const catalog = await findProductAndColor(
          productId,
          colorId,
          transaction
        )

        if (catalog.error) {
          const error = new Error(catalog.error)
          error.statusCode = catalog.statusCode
          throw error
        }

        if (is_primary) {
          await ProductImage.update(
            {
              is_primary: false,
            },
            {
              where: {
                product_id: productId,
                product_color_id: colorId,
              },
              transaction,
            }
          )
        }

        return ProductImage.create(
          {
            product_id: productId,
            product_color_id: colorId,
            image_url: image_url.trim(),
            alt_text: alt_text?.trim() || null,
            sort_order: sortOrder,
            is_primary,
          },
          {
            transaction,
          }
        )
      }
    )

    return res.status(201).json(image)
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
      })
    }

    console.error('Erro ao criar imagem:', error)

    return res.status(500).json({
      error: 'Não foi possível criar a imagem',
    })
  }
}

export async function updateImage(req, res) {
  try {
    const productId = Number(req.params.productId)
    const imageId = Number(req.params.imageId)
    const {
      image_url,
      alt_text,
      sort_order,
      is_primary,
    } = req.body

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(imageId)
    ) {
      return res.status(400).json({
        error: 'Produto ou imagem inválidos',
      })
    }

    if (
      image_url !== undefined &&
      !isValidImageUrl(image_url)
    ) {
      return res.status(400).json({
        error: 'URL da imagem inválida',
      })
    }

    const sortOrder =
      sort_order === undefined
        ? undefined
        : Number(sort_order)

    if (
      sortOrder !== undefined &&
      (!Number.isInteger(sortOrder) || sortOrder < 0)
    ) {
      return res.status(400).json({
        error: 'Ordem da imagem inválida',
      })
    }

    if (
      is_primary !== undefined &&
      typeof is_primary !== 'boolean'
    ) {
      return res.status(400).json({
        error: 'O campo is_primary deve ser booleano',
      })
    }

    const updatedImage = await sequelize.transaction(
      async transaction => {
        const image = await ProductImage.findOne({
          where: {
            id: imageId,
            product_id: productId,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        })

        if (!image) {
          const error = new Error('Imagem não encontrada')
          error.statusCode = 404
          throw error
        }

        if (is_primary === true) {
          await ProductImage.update(
            {
              is_primary: false,
            },
            {
              where: {
                product_id: productId,
                product_color_id:
                  image.product_color_id,
              },
              transaction,
            }
          )
        }

        const changes = {}

        if (image_url !== undefined) {
          changes.image_url = image_url.trim()
        }

        if (alt_text !== undefined) {
          changes.alt_text =
            String(alt_text).trim() || null
        }

        if (sortOrder !== undefined) {
          changes.sort_order = sortOrder
        }

        if (is_primary !== undefined) {
          changes.is_primary = is_primary
        }

        await image.update(changes, {
          transaction,
        })

        return image
      }
    )

    return res.json(updatedImage)
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
      })
    }

    console.error('Erro ao atualizar imagem:', error)

    return res.status(500).json({
      error: 'Não foi possível atualizar a imagem',
    })
  }
}

export async function removeImage(req, res) {
  try {
    const productId = Number(req.params.productId)
    const imageId = Number(req.params.imageId)

    const image = await ProductImage.findOne({
      where: {
        id: imageId,
        product_id: productId,
      },
    })

    if (!image) {
      return res.status(404).json({
        error: 'Imagem não encontrada',
      })
    }

    await image.destroy()

    return res.json({
      message: 'Imagem removida com sucesso',
    })
  } catch (error) {
    console.error('Erro ao remover imagem:', error)

    return res.status(500).json({
      error: 'Não foi possível remover a imagem',
    })
  }
}