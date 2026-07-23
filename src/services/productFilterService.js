function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getActiveVariants(product) {
  if (!Array.isArray(product.variants)) {
    return []
  }

  return product.variants.filter(
    variant =>
      variant.active !== false &&
      Number(variant.stock) > 0
  )
}

function getMatchingColorIds(
  product,
  color
) {
  const normalizedColor =
    normalizeText(color)

  if (!normalizedColor) {
    return null
  }

  const colors = Array.isArray(
    product.colors
  )
    ? product.colors
    : []

  return new Set(
    colors
      .filter(item => {
        return (
          normalizeText(item.slug) ===
            normalizedColor ||
          normalizeText(item.name) ===
            normalizedColor
        )
      })
      .map(item => Number(item.id))
  )
}

function matchesOptions(
  product,
  color,
  size
) {
  const normalizedSize =
    normalizeText(size)

  const colorIds =
    getMatchingColorIds(
      product,
      color
    )

  if (
    colorIds === null &&
    !normalizedSize
  ) {
    return true
  }

  const variants =
    getActiveVariants(product)

  return variants.some(variant => {
    const matchesColor =
      colorIds === null ||
      colorIds.has(
        Number(
          variant.product_color_id
        )
      )

    const matchesSize =
      !normalizedSize ||
      normalizeText(variant.size) ===
        normalizedSize

    return matchesColor && matchesSize
  })
}

function getAvailablePrices(product) {
  const variants =
    getActiveVariants(product)

  if (variants.length === 0) {
    return [
      Number(product.price),
    ]
  }

  return variants.map(variant => {
    if (
      variant.price_override !== null &&
      variant.price_override !== undefined
    ) {
      return Number(
        variant.price_override
      )
    }

    return Number(product.price)
  })
}

function matchesPrice(
  product,
  minPrice,
  maxPrice
) {
  const prices =
    getAvailablePrices(product)

  return prices.some(price => {
    if (!Number.isFinite(price)) {
      return false
    }

    if (
      minPrice !== null &&
      price < minPrice
    ) {
      return false
    }

    if (
      maxPrice !== null &&
      price > maxPrice
    ) {
      return false
    }

    return true
  })
}

export function filterProducts(
  products,
  {
    color = '',
    size = '',
    minPrice = null,
    maxPrice = null,
  } = {}
) {
  return products.filter(product => {
    return (
      matchesOptions(
        product,
        color,
        size
      ) &&
      matchesPrice(
        product,
        minPrice,
        maxPrice
      )
    )
  })
}