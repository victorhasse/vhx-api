import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  convertPriceToCents,
  createRequestError,
  groupQuantitiesByProduct,
  normalizeRequestedItems,
} from './checkoutService.js'

describe('createRequestError', () => {
  it('cria um erro de requisição', () => {
    const error = createRequestError(
      'Dados inválidos',
      422
    )

    expect(error.message).toBe(
      'Dados inválidos'
    )

    expect(error.statusCode).toBe(422)
    expect(error.isRequestError).toBe(true)
  })
})

describe('convertPriceToCents', () => {
  it('converte número para centavos', () => {
    expect(
      convertPriceToCents(
        349.99,
        'Camiseta'
      )
    ).toBe(34999)
  })

  it('converte preço com vírgula', () => {
    expect(
      convertPriceToCents(
        '79,90',
        'Boné'
      )
    ).toBe(7990)
  })

  it('rejeita um preço inválido', () => {
    expect(() =>
      convertPriceToCents(
        'preço inválido',
        'Produto'
      )
    ).toThrow(
      'Preço inválido para o produto "Produto"'
    )
  })
})

describe('normalizeRequestedItems', () => {
  it('normaliza os itens do carrinho', () => {
    expect(
      normalizeRequestedItems([
        {
          id: '12',
          quantity: '2',
          selectedSize: 'M',
        },
      ])
    ).toEqual([
      {
        productId: 12,
        quantity: 2,
        selectedSize: 'M',
      },
    ])
  })

  it('utiliza tamanho nulo quando ausente', () => {
    const [item] =
      normalizeRequestedItems([
        {
          id: 5,
          quantity: 1,
        },
      ])

    expect(item.selectedSize).toBeNull()
  })

  it('rejeita carrinho vazio', () => {
    expect(() =>
      normalizeRequestedItems([])
    ).toThrow('Carrinho vazio')
  })

  it('rejeita quantidade inválida', () => {
    expect(() =>
      normalizeRequestedItems([
        {
          id: 1,
          quantity: 0,
        },
      ])
    ).toThrow(
      'O carrinho possui um item inválido'
    )
  })
})

describe('groupQuantitiesByProduct', () => {
  it('soma itens repetidos do mesmo produto', () => {
    const quantities =
      groupQuantitiesByProduct([
        {
          productId: 10,
          quantity: 2,
        },
        {
          productId: 10,
          quantity: 3,
        },
        {
          productId: 20,
          quantity: 1,
        },
      ])

    expect(quantities.get(10)).toBe(5)
    expect(quantities.get(20)).toBe(1)
  })
})