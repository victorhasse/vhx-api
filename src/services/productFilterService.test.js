import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  filterProducts,
} from './productFilterService.js'

const products = [
  {
    id: 1,
    name: 'Camiseta',
    price: '100.00',
    colors: [
      {
        id: 10,
        name: 'Preto',
        slug: 'preto',
      },
      {
        id: 11,
        name: 'Branco',
        slug: 'branco',
      },
    ],
    variants: [
      {
        id: 100,
        product_color_id: 10,
        size: 'M',
        stock: 5,
        price_override: null,
        active: true,
      },
      {
        id: 101,
        product_color_id: 11,
        size: 'G',
        stock: 3,
        price_override: '120.00',
        active: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Boné',
    price: '80.00',
    colors: [],
    variants: [],
  },
]

describe('filterProducts', () => {
  it('filtra por cor', () => {
    const result = filterProducts(
      products,
      {
        color: 'preto',
      }
    )

    expect(
      result.map(product => product.id)
    ).toEqual([1])
  })

  it('filtra por tamanho', () => {
    const result = filterProducts(
      products,
      {
        size: 'G',
      }
    )

    expect(
      result.map(product => product.id)
    ).toEqual([1])
  })

  it('exige cor e tamanho na mesma variante', () => {
    const result = filterProducts(
      products,
      {
        color: 'preto',
        size: 'G',
      }
    )

    expect(result).toEqual([])
  })

  it('ignora variantes sem estoque', () => {
    const result = filterProducts(
      [
        {
          ...products[0],
          variants: [
            {
              id: 100,
              product_color_id: 10,
              size: 'M',
              stock: 0,
              active: true,
            },
          ],
        },
      ],
      {
        color: 'preto',
      }
    )

    expect(result).toEqual([])
  })

  it('filtra pelo preço da variante', () => {
    const result = filterProducts(
      products,
      {
        minPrice: 110,
        maxPrice: 130,
      }
    )

    expect(
      result.map(product => product.id)
    ).toEqual([1])
  })

  it('filtra produto legado pelo preço padrão', () => {
    const result = filterProducts(
      products,
      {
        minPrice: 70,
        maxPrice: 90,
      }
    )

    expect(
      result.map(product => product.id)
    ).toEqual([2])
  })

  it('combina opção e faixa de preço', () => {
    const result = filterProducts(
      products,
      {
        color: 'branco',
        size: 'G',
        minPrice: 110,
      }
    )

    expect(
      result.map(product => product.id)
    ).toEqual([1])
  })
})