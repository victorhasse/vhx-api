import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const transaction = {
  LOCK: {
    UPDATE: 'UPDATE',
  },
}

vi.mock('../database/connection.js', () => ({
  default: {
    transaction: vi.fn(
      async callback => callback(transaction)
    ),
  },
}))

vi.mock('../models/Product.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}))

vi.mock('../models/ProductColor.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}))

vi.mock('../models/ProductImage.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  },
}))

import sequelize from '../database/connection.js'
import Product from '../models/Product.js'
import ProductColor from '../models/ProductColor.js'
import ProductImage from '../models/ProductImage.js'

import {
  createImage,
  updateImage,
  removeImage,
} from './productImageController.js'

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)

  return res
}

describe('productImageController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createImage', () => {
    it('cria uma imagem principal para uma cor', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          product_color_id: 2,
          image_url:
            'https://example.com/preto.webp',
          alt_text: 'Camiseta preta',
          sort_order: 1,
          is_primary: true,
        },
      }

      const res = createResponse()

      Product.findOne.mockResolvedValue({
        id: 10,
      })

      ProductColor.findOne.mockResolvedValue({
        id: 2,
        product_id: 10,
      })

      ProductImage.update.mockResolvedValue([1])

      ProductImage.create.mockResolvedValue({
        id: 5,
        product_id: 10,
        product_color_id: 2,
        image_url:
          'https://example.com/preto.webp',
        is_primary: true,
      })

      await createImage(req, res)

      expect(sequelize.transaction)
        .toHaveBeenCalledTimes(1)

      expect(ProductImage.update)
        .toHaveBeenCalledWith(
          {
            is_primary: false,
          },
          {
            where: {
              product_id: 10,
              product_color_id: 2,
            },
            transaction,
          }
        )

      expect(ProductImage.create)
        .toHaveBeenCalledWith(
          {
            product_id: 10,
            product_color_id: 2,
            image_url:
              'https://example.com/preto.webp',
            alt_text: 'Camiseta preta',
            sort_order: 1,
            is_primary: true,
          },
          {
            transaction,
          }
        )

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('rejeita URL de imagem inválida', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          image_url: 'arquivo-sem-url',
          is_primary: false,
        },
      }

      const res = createResponse()

      await createImage(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(Product.findOne).not.toHaveBeenCalled()
      expect(ProductImage.create).not.toHaveBeenCalled()
    })

    it('rejeita cor pertencente a outro produto', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          product_color_id: 99,
          image_url:
            'https://example.com/imagem.webp',
          is_primary: false,
        },
      }

      const res = createResponse()

      Product.findOne.mockResolvedValue({
        id: 10,
      })

      ProductColor.findOne.mockResolvedValue(null)

      await createImage(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(ProductImage.create).not.toHaveBeenCalled()
    })
  })

  describe('updateImage', () => {
    it('torna a imagem principal e desmarca as demais', async () => {
      const req = {
        params: {
          productId: '10',
          imageId: '5',
        },
        body: {
          is_primary: true,
          sort_order: 0,
        },
      }

      const res = createResponse()
      const imageUpdate = vi.fn()
        .mockResolvedValue(undefined)

      ProductImage.findOne.mockResolvedValue({
        id: 5,
        product_id: 10,
        product_color_id: 2,
        update: imageUpdate,
      })

      ProductImage.update.mockResolvedValue([2])

      await updateImage(req, res)

      expect(ProductImage.findOne)
        .toHaveBeenCalledWith({
          where: {
            id: 5,
            product_id: 10,
          },
          transaction,
          lock: 'UPDATE',
        })

      expect(ProductImage.update)
        .toHaveBeenCalledWith(
          {
            is_primary: false,
          },
          {
            where: {
              product_id: 10,
              product_color_id: 2,
            },
            transaction,
          }
        )

      expect(imageUpdate).toHaveBeenCalledWith(
        {
          sort_order: 0,
          is_primary: true,
        },
        {
          transaction,
        }
      )

      expect(res.json).toHaveBeenCalled()
    })

    it('rejeita is_primary enviado como string', async () => {
      const req = {
        params: {
          productId: '10',
          imageId: '5',
        },
        body: {
          is_primary: 'true',
        },
      }

      const res = createResponse()

      await updateImage(req, res)

      expect(res.status).toHaveBeenCalledWith(400)

      expect(ProductImage.findOne)
        .not.toHaveBeenCalled()
    })
  })

  describe('removeImage', () => {
    it('remove a imagem encontrada', async () => {
      const req = {
        params: {
          productId: '10',
          imageId: '5',
        },
        body: {},
      }

      const res = createResponse()
      const destroy = vi.fn()
        .mockResolvedValue(undefined)

      ProductImage.findOne.mockResolvedValue({
        id: 5,
        product_id: 10,
        destroy,
      })

      await removeImage(req, res)

      expect(destroy).toHaveBeenCalledTimes(1)

      expect(res.json).toHaveBeenCalledWith({
        message: 'Imagem removida com sucesso',
      })
    })

    it('retorna 404 para imagem inexistente', async () => {
      const req = {
        params: {
          productId: '10',
          imageId: '999',
        },
        body: {},
      }

      const res = createResponse()

      ProductImage.findOne.mockResolvedValue(null)

      await removeImage(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })
})