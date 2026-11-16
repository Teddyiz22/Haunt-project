const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,79}$/i
const SIZE_PATTERN = /^[A-Za-z0-9.\-\/ ]{1,20}$/
const PRICE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const ALLOWED_SORT = new Set(['newest', 'price_asc', 'price_desc'])

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isBooleanLike(value) {
  return value === true || value === false || value === 0 || value === 1 || value === '0' || value === '1' || value === 'true' || value === 'false'
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return fallback
}

export function slugify(value) {
  return asTrimmedString(value)
    .replace(/[Λλ]/g, 'A')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200)
}

export function validateListQuery(request) {
  const errors = []
  const query = request.query
  const page = Number.parseInt(query.page, 10)
  const limit = Number.parseInt(query.limit, 10)
  const sort = asTrimmedString(query.sort) || 'newest'

  if (query.page !== undefined && (!Number.isInteger(page) || page < 1)) {
    errors.push('page must be a positive integer.')
  }
  if (query.limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 48)) {
    errors.push('limit must be an integer between 1 and 48.')
  }
  if (query.sort !== undefined && !ALLOWED_SORT.has(sort)) {
    errors.push('sort must be newest, price_asc, or price_desc.')
  }
  if (query.minPrice !== undefined && !PRICE_PATTERN.test(String(query.minPrice))) {
    errors.push('minPrice must be a non-negative decimal with up to 2 fraction digits.')
  }
  if (query.maxPrice !== undefined && !PRICE_PATTERN.test(String(query.maxPrice))) {
    errors.push('maxPrice must be a non-negative decimal with up to 2 fraction digits.')
  }
  if (query.minPrice && query.maxPrice && Number(query.minPrice) > Number(query.maxPrice)) {
    errors.push('minPrice cannot be greater than maxPrice.')
  }
  if (query.size && !SIZE_PATTERN.test(String(query.size))) {
    errors.push('size is invalid.')
  }
  if (query.featured !== undefined && !isBooleanLike(query.featured)) {
    errors.push('featured must be true or false.')
  }

  request.validatedQuery = {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 48) : 12,
    sort: ALLOWED_SORT.has(sort) ? sort : 'newest',
    search: asTrimmedString(query.search || query.q).slice(0, 180),
    category: asTrimmedString(query.category).slice(0, 140),
    size: asTrimmedString(query.size).slice(0, 20),
    minPrice: query.minPrice !== undefined ? query.minPrice : null,
    maxPrice: query.maxPrice !== undefined ? query.maxPrice : null,
    featured: query.featured === undefined ? null : parseBoolean(query.featured),
  }

  return errors
}

function validateImagePayload(image, index, errors) {
  if (!image || typeof image !== 'object') {
    errors.push(`images[${index}] must be an object.`)
    return
  }
  const imageUrl = asTrimmedString(image.image_url || image.imageUrl)
  if (!imageUrl || imageUrl.length > 2048) {
    errors.push(`images[${index}].image_url is required and must be at most 2048 characters.`)
  }
  if (imageUrl && !imageUrl.startsWith('/uploads/') && !/^https?:\/\//i.test(imageUrl)) {
    errors.push(`images[${index}].image_url must be an uploaded path or http(s) URL.`)
  }
}

function validateVariantPayload(variant, index, errors, seenSizes) {
  if (!variant || typeof variant !== 'object') {
    errors.push(`variants[${index}] must be an object.`)
    return
  }
  const size = asTrimmedString(variant.size)
  const sku = asTrimmedString(variant.sku)
  const stock = Number(variant.stock_quantity ?? variant.stockQuantity)

  if (!SIZE_PATTERN.test(size)) errors.push(`variants[${index}].size is required.`)
  if (size && seenSizes.has(size.toUpperCase())) errors.push(`variants[${index}].size is duplicated.`)
  if (size) seenSizes.add(size.toUpperCase())
  if (!SKU_PATTERN.test(sku)) errors.push(`variants[${index}].sku is required and must be 2-80 alphanumeric characters.`)
  if (!Number.isInteger(stock) || stock < 0) errors.push(`variants[${index}].stock_quantity must be an integer of 0 or more.`)
}

export function validateProductWrite(request) {
  const errors = []
  const body = request.body || {}
  const name = asTrimmedString(body.name)
  const slug = asTrimmedString(body.slug) || slugify(name)
  const sku = asTrimmedString(body.sku)
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const price = body.price_mmk ?? body.priceMmk
  const categoryId = body.category_id ?? body.categoryId
  const images = Array.isArray(body.images) ? body.images : []
  const variants = Array.isArray(body.variants) ? body.variants : []

  if (!name || name.length > 180) errors.push('name is required and must be at most 180 characters.')
  if (!slug || !SLUG_PATTERN.test(slug) || slug.length > 200) errors.push('slug must be a lowercase hyphenated identifier.')
  if (!SKU_PATTERN.test(sku)) errors.push('sku is required and must be 2-80 alphanumeric characters.')
  if (description.length > 8000) errors.push('description must be at most 8000 characters.')
  if (!PRICE_PATTERN.test(String(price))) errors.push('price_mmk must be a non-negative decimal with up to 2 fraction digits.')
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    const numericCategoryId = Number(categoryId)
    if (!Number.isInteger(numericCategoryId) || numericCategoryId < 1) {
      errors.push('category_id must be a positive integer.')
    }
  }
  if (body.is_featured !== undefined && !isBooleanLike(body.is_featured)) errors.push('is_featured must be a boolean.')
  if (body.is_active !== undefined && !isBooleanLike(body.is_active)) errors.push('is_active must be a boolean.')
  if (images.length > 12) errors.push('A product may have at most 12 images.')
  images.forEach((image, index) => validateImagePayload(image, index, errors))
  if (request.method === 'POST' && variants.length < 1) errors.push('At least one size variant is required.')
  const seenSizes = new Set()
  variants.forEach((variant, index) => validateVariantPayload(variant, index, errors, seenSizes))

  request.validatedBody = {
    name,
    slug,
    sku,
    description: description || null,
    price_mmk: String(price),
    category_id: categoryId === undefined || categoryId === null || categoryId === '' ? null : Number(categoryId),
    is_featured: parseBoolean(body.is_featured, false),
    is_active: parseBoolean(body.is_active, true),
    images: images.map((image, index) => ({
      image_url: asTrimmedString(image.image_url || image.imageUrl),
      alt_text: asTrimmedString(image.alt_text || image.altText).slice(0, 255) || null,
      sort_order: Number.isInteger(Number(image.sort_order ?? image.sortOrder)) ? Number(image.sort_order ?? image.sortOrder) : index,
      is_primary: parseBoolean(image.is_primary ?? image.isPrimary, index === 0),
    })),
    variants: variants.map((variant) => ({
      size: asTrimmedString(variant.size),
      sku: asTrimmedString(variant.sku),
      stock_quantity: Number(variant.stock_quantity ?? variant.stockQuantity),
      is_active: parseBoolean(variant.is_active ?? variant.isActive, true),
    })),
    replaceImages: Object.hasOwn(body, 'images'),
    replaceVariants: Object.hasOwn(body, 'variants'),
  }

  return errors
}

export function validateProductIdParam(request) {
  const id = Number.parseInt(request.params.id, 10)
  if (!Number.isInteger(id) || id < 1) return ['Product id must be a positive integer.']
  request.validatedParams = { id }
  return []
}

export function validateSlugParam(request) {
  const slug = asTrimmedString(request.params.slug)
  if (!slug || slug.length > 200) return ['A valid product slug is required.']
  request.validatedParams = { slug }
  return []
}
