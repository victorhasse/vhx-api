import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildShippingPayload,
  buildShippingProducts,
} from './shippingService.js'

function createProduct(
  overrides = {}
) {
  return {
    id: 10,
    name: 'Camiseta VHX',
    price: '149.90',
    weight: '0.350',
    width: '20.00',
    height: '10.00',
    length: '30.00',
    ...overrides,
  }
}

describe('buildShippingProducts', () => {
  it('monta os produtos para o Melhor Envio', () => {
    const productsById = new Map([
      [10, createProduct()],
    ])

    const products =
      buildShippingProducts(
        [
          {
            productId: 10,
            quantity: 2,
          },
        ],
        productsById
      )

    expect(products).toEqual([
      {
        id: '10',
        width: 20,
        height: 10,
        length: 30,
        weight: 0.35,
        insurance_value: 149.9,
        quantity: 2,
      },
    ])
  })

  it('rejeita produto sem medidas de frete', () => {
    const productsById = new Map([
      [
        10,
        createProduct({
          weight: null,
        }),
      ],
    ])

    expect(() =>
      buildShippingProducts(
        [
          {
            productId: 10,
            quantity: 1,
          },
        ],
        productsById
      )
    ).toThrow(
      'não possui peso válido'
    )
  })

  it('rejeita produto inexistente', () => {
    expect(() =>
      buildShippingProducts(
        [
          {
            productId: 99,
            quantity: 1,
          },
        ],
        new Map()
      )
    ).toThrow(
      'Um ou mais produtos não estão disponíveis'
    )
  })
})

describe('buildShippingPayload', () => {
  it('normaliza os CEPs e monta o payload', () => {
    const payload =
      buildShippingPayload({
        originPostalCode: '88035-000',
        destinationPostalCode:
          '01310-100',
        requestedItems: [
          {
            productId: 10,
            quantity: 1,
          },
        ],
        productsById: new Map([
          [10, createProduct()],
        ]),
      })

    expect(payload.from.postal_code).toBe(
      '88035000'
    )

    expect(payload.to.postal_code).toBe(
      '01310100'
    )

    expect(payload.products).toHaveLength(1)
  })

  it('rejeita CEP de destino inválido', () => {
    expect(() =>
      buildShippingPayload({
        originPostalCode: '88035000',
        destinationPostalCode: '123',
        requestedItems: [
          {
            productId: 10,
            quantity: 1,
          },
        ],
        productsById: new Map([
          [10, createProduct()],
        ]),
      })
    ).toThrow('Informe um CEP válido')
  })
})