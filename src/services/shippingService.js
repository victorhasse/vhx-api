import {
  createRequestError,
} from './checkoutService.js'

function normalizeMeasurement(
  value,
  field,
  productName
) {
  const normalizedValue =
    typeof value === 'string'
      ? value.replace(',', '.').trim()
      : value

  const measurement = Number(normalizedValue)

  if (
    !Number.isFinite(measurement) ||
    measurement <= 0
  ) {
    throw createRequestError(
      `O produto "${productName}" não possui ${field} válido para o cálculo do frete`
    )
  }

  return measurement
}

function normalizePostalCode(value) {
  const postalCode = String(value || '')
    .replace(/\D/g, '')

  if (!/^\d{8}$/.test(postalCode)) {
    throw createRequestError(
      'Informe um CEP válido'
    )
  }

  return postalCode
}

export function buildShippingProducts(
  requestedItems,
  productsById
) {
  return requestedItems.map(item => {
    const product =
      productsById.get(item.productId)

    if (!product) {
      throw createRequestError(
        'Um ou mais produtos não estão disponíveis'
      )
    }

    const productName = product.name

    return {
      id: String(product.id),
      width: normalizeMeasurement(
        product.width,
        'largura',
        productName
      ),
      height: normalizeMeasurement(
        product.height,
        'altura',
        productName
      ),
      length: normalizeMeasurement(
        product.length,
        'comprimento',
        productName
      ),
      weight: normalizeMeasurement(
        product.weight,
        'peso',
        productName
      ),
      insurance_value: Number(product.price),
      quantity: item.quantity,
    }
  })
}

export function buildShippingPayload({
  destinationPostalCode,
  requestedItems,
  productsById,
  originPostalCode =
    process.env.STORE_POSTAL_CODE,
}) {
  return {
    from: {
      postal_code:
        normalizePostalCode(
          originPostalCode
        ),
    },
    to: {
      postal_code:
        normalizePostalCode(
          destinationPostalCode
        ),
    },
    products: buildShippingProducts(
      requestedItems,
      productsById
    ),
    options: {
      receipt: false,
      own_hand: false,
    },
  }
}