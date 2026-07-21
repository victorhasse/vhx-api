import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

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

vi.mock('../models/ProductVariant.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    findByPk: vi.fn(),
  },
}))

import Product from '../models/Product.js'
import ProductColor from '../models/ProductColor.js'
import ProductVariant from '../models/ProductVariant.js'

import {
  createVariant,
  updateVariant,
  removeVariant,
} from './productVariantController.js'

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)

  return res
}

describe('productVariantController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createVariant', () => {
    it('cria uma variante normalizada', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          product_color_id: 2,
          sku: ' camiseta preta m ',
          size: 'M',
          stock: '15',
          price_override: '129,90',
        },
      }

      const res = createResponse()

      Product.findOne.mockResolvedValue({
        id: 10,
        active: true,
      })

      ProductColor.findOne.mockResolvedValue({
        id: 2,
        product_id: 10,
        active: true,
      })

      ProductVariant.create.mockResolvedValue({
        id: 7,
      })

      ProductVariant.findByPk.mockResolvedValue({
        id: 7,
        product_id: 10,
        product_color_id: 2,
        sku: 'CAMISETA-PRETA-M',
        size: 'M',
        stock: 15,
        price_override: 129.9,
      })

      await createVariant(req, res)

      expect(ProductVariant.create)
        .toHaveBeenCalledWith({
          product_id: 10,
          product_color_id: 2,
          sku: 'CAMISETA-PRETA-M',
          size: 'M',
          stock: 15,
          price_override: 129.9,
          active: true,
        })

      expect(res.status).toHaveBeenCalledWith(201)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          sku: 'CAMISETA-PRETA-M',
        })
      )
    })

    it('aceita tamanho numérico', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          sku: 'TENIS-40',
          size: 40,
          stock: 3,
        },
      }

      const res = createResponse()

      Product.findOne.mockResolvedValue({
        id: 10,
      })

      ProductVariant.create.mockResolvedValue({
        id: 8,
      })

      ProductVariant.findByPk.mockResolvedValue({
        id: 8,
      })

      await createVariant(req, res)

      expect(ProductVariant.create)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            size: '40',
          })
        )

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('rejeita estoque negativo', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          sku: 'VHX-001',
          stock: -1,
        },
      }

      const res = createResponse()

      await createVariant(req, res)

      expect(res.status).toHaveBeenCalledWith(400)

      expect(Product.findOne).not.toHaveBeenCalled()

      expect(ProductVariant.create)
        .not.toHaveBeenCalled()
    })

    it('rejeita uma cor de outro produto', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          product_color_id: 99,
          sku: 'VHX-001',
          stock: 5,
        },
      }

      const res = createResponse()

      Product.findOne.mockResolvedValue({
        id: 10,
      })

      ProductColor.findOne.mockResolvedValue(null)

      await createVariant(req, res)

      expect(res.status).toHaveBeenCalledWith(404)

      expect(ProductVariant.create)
        .not.toHaveBeenCalled()
    })

    it('retorna 409 para SKU duplicado', async () => {
      const req = {
        params: {
          productId: '10',
        },
        body: {
          sku: 'VHX-001',
          stock: 5,
        },
      }

      const res = createResponse()

      Product.findOne.mockResolvedValue({
        id: 10,
      })

      const databaseError = new Error(
        'Unique constraint'
      )

      databaseError.name =
        'SequelizeUniqueConstraintError'

      ProductVariant.create.mockRejectedValue(
        databaseError
      )

      await createVariant(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
    })
  })

  describe('updateVariant', () => {
    it('atualiza estoque e remove o preço específico', async () => {
      const req = {
        params: {
          productId: '10',
          variantId: '7',
        },
        body: {
          stock: 20,
          price_override: null,
        },
      }

      const res = createResponse()
      const update = vi.fn()
        .mockResolvedValue(undefined)

      ProductVariant.findOne.mockResolvedValue({
        id: 7,
        product_id: 10,
        update,
      })

      ProductVariant.findByPk.mockResolvedValue({
        id: 7,
        stock: 20,
        price_override: null,
      })

      await updateVariant(req, res)

      expect(update).toHaveBeenCalledWith({
        stock: 20,
        price_override: null,
      })

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          stock: 20,
        })
      )
    })

    it('rejeita active enviado como string', async () => {
      const req = {
        params: {
          productId: '10',
          variantId: '7',
        },
        body: {
          active: 'false',
        },
      }

      const res = createResponse()
      const update = vi.fn()

      ProductVariant.findOne.mockResolvedValue({
        id: 7,
        product_id: 10,
        update,
      })

      await updateVariant(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(update).not.toHaveBeenCalled()
    })
  })

  describe('removeVariant', () => {
    it('desativa a variante sem apagar o histórico', async () => {
      const req = {
        params: {
          productId: '10',
          variantId: '7',
        },
        body: {},
      }

      const res = createResponse()
      const update = vi.fn()
        .mockResolvedValue(undefined)

      ProductVariant.findOne.mockResolvedValue({
        id: 7,
        product_id: 10,
        update,
      })

      await removeVariant(req, res)

      expect(update).toHaveBeenCalledWith({
        active: false,
      })

      expect(res.json).toHaveBeenCalledWith({
        message: 'Variante desativada com sucesso',
      })
    })

    it('retorna 404 para variante inexistente', async () => {
      const req = {
        params: {
          productId: '10',
          variantId: '999',
        },
        body: {},
      }

      const res = createResponse()

      ProductVariant.findOne.mockResolvedValue(null)

      await removeVariant(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })
})