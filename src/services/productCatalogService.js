export function normalizeSlug(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(
    String(value)
  )
}

export function isValidImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false
  }

  const imageUrl = value.trim()

  if (imageUrl.startsWith('/')) {
    return true
  }

  try {
    const parsedUrl = new URL(imageUrl)

    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:'
    )
  } catch {
    return false
  }
}

export function normalizeSku(value) {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
}

export function validateStock(value) {
  const stock = Number(value)

  return Number.isInteger(stock) && stock >= 0
}

export function normalizeOptionalPrice(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const normalizedValue =
    typeof value === 'string'
      ? value.replace(',', '.').trim()
      : value

  const price = Number(normalizedValue)

  if (!Number.isFinite(price) || price < 0) {
    return undefined
  }

  return Math.round(price * 100) / 100
}