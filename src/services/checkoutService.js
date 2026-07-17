export function createRequestError(
  message,
  statusCode = 400
) {
  const error = new Error(message)

  error.statusCode = statusCode
  error.isRequestError = true

  return error
}

export function convertPriceToCents(
  value,
  productName
) {
  const normalizedValue =
    typeof value === 'string'
      ? value.replace(',', '.').trim()
      : value

  const price = Number(normalizedValue)

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw createRequestError(
      `Preço inválido para o produto "${productName}"`
    )
  }

  const priceInCents =
    Math.round(price * 100)

  if (
    !Number.isSafeInteger(priceInCents)
  ) {
    throw createRequestError(
      `Preço inválido para o produto "${productName}"`
    )
  }

  return priceInCents
}

export function normalizeRequestedItems(
  items
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw createRequestError(
      'Carrinho vazio'
    )
  }

  return items.map(item => {
    const productId = Number(item.id)
    const quantity = Number(item.quantity)

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw createRequestError(
        'O carrinho possui um item inválido'
      )
    }

    return {
      productId,
      quantity,
      selectedSize:
        item.selectedSize || null,
    }
  })
}

export function groupQuantitiesByProduct(
  items
) {
  const quantities = new Map()

  for (const item of items) {
    const currentQuantity =
      quantities.get(item.productId) || 0

    quantities.set(
      item.productId,
      currentQuantity + item.quantity
    )
  }

  return quantities
}