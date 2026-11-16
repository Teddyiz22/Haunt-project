// Guest checkout validators. Each validator receives the request, returns an
// array of readable validation errors, and stores the cleaned payload on the
// request (validatedBody / validatedParams / validatedQuery) for the
// controller, following the productValidators pattern.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COUNTRY_PATTERN = /^[A-Za-z]{2}$/
const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalTrimmed(value, maxLength) {
  const text = asTrimmedString(value)
  return text ? text.slice(0, maxLength) : ''
}

export function validateOrderCreate(request) {
  const errors = []
  const body = request.body || {}
  const customer = body.customer || {}
  const items = Array.isArray(body.items) ? body.items : []

  const name = asTrimmedString(customer.name)
  const email = asTrimmedString(customer.email).toLowerCase()
  const phone = asTrimmedString(customer.phone)
  const addressLine1 = asTrimmedString(customer.addressLine1)
  const addressLine2 = optionalTrimmed(customer.addressLine2, 255)
  const city = asTrimmedString(customer.city)
  const region = optionalTrimmed(customer.region, 120)
  const postalCode = optionalTrimmed(customer.postalCode, 30)
  const countryCode = (asTrimmedString(customer.countryCode) || 'MM').toUpperCase()

  if (!name || name.length > 200) errors.push('customer.name is required and must be at most 200 characters.')
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push('customer.email is required and must be a valid email address.')
  }
  if (!phone || phone.length > 40) errors.push('customer.phone is required and must be at most 40 characters.')
  if (!addressLine1 || addressLine1.length > 255) {
    errors.push('customer.addressLine1 is required and must be at most 255 characters.')
  }
  if (!city || city.length > 120) errors.push('customer.city is required and must be at most 120 characters.')
  if (!COUNTRY_PATTERN.test(countryCode)) {
    errors.push('customer.countryCode must be a 2-letter country code.')
  }

  if (!items.length) errors.push('items must contain at least one item.')
  if (items.length > 50) errors.push('items must contain at most 50 items.')

  const seenVariants = new Set()
  const cleanedItems = []
  items.forEach((item, index) => {
    const variantId = Number(item?.variantId)
    const quantity = Number(item?.quantity)
    if (!Number.isInteger(variantId) || variantId < 1) {
      errors.push(`items[${index}].variantId must be a positive integer.`)
      return
    }
    if (seenVariants.has(variantId)) {
      errors.push(`items[${index}].variantId is duplicated.`)
      return
    }
    seenVariants.add(variantId)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errors.push(`items[${index}].quantity must be an integer between 1 and 99.`)
      return
    }
    cleanedItems.push({ variantId, quantity })
  })

  request.validatedBody = {
    customer: {
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      countryCode,
    },
    items: cleanedItems,
  }

  return errors
}

export function validateOrderNumberParam(request) {
  const errors = []
  const orderNumber = asTrimmedString(request.params.orderNumber)
  if (!orderNumber || !ORDER_NUMBER_PATTERN.test(orderNumber)) {
    errors.push('orderNumber is invalid.')
  }
  request.validatedParams = { orderNumber }
  return errors
}

export function validateOrderLookup(request) {
  const errors = validateOrderNumberParam(request)
  const email = asTrimmedString(request.query.email).toLowerCase()
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push('email is required and must be a valid email address.')
  }
  request.validatedQuery = { email }
  return errors
}
