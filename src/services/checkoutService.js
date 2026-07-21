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

export function normalizeRequestedItems(items) {
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

    const rawVariantId =
      item.variantId ??
      item.product_variant_id ??
      null
    const variantId =
      rawVariantId === null ||
      rawVariantId === ''
        ? null
        : Number(rawVariantId)

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      (
        variantId !== null &&
        (!Number.isInteger(variantId) || variantId <= 0)
      )
    ) {
      throw createRequestError(
        'O carrinho possui um item inválido'
      )
    }

    const normalizedItem = {
      productId,
      quantity,
      selectedSize:
        item.selectedSize || null,
    }

    if (variantId !== null) {
      normalizedItem.variantId = variantId
    }

    return normalizedItem
  })
}

export function groupQuantitiesByProduct(items) {
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

export function groupQuantitiesByVariant(items) {
  const quantities = new Map()

  for (const item of items) {
    if (!item.variantId) {
      continue
    }

    const currentQuantity =
      quantities.get(item.variantId) || 0

    quantities.set(
      item.variantId,
      currentQuantity + item.quantity
    )
  }

  return quantities
}