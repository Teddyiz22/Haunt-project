const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/
const ORDER_STATUSES = new Set([
  'pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled', 'refunded',
])

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateAdminOrderList(request) {
  const errors = []
  const query = request.query
  const page = Number.parseInt(query.page, 10)
  const limit = Number.parseInt(query.limit, 10)
  const status = asTrimmedString(query.status)

  if (query.page !== undefined && (!Number.isInteger(page) || page < 1)) {
    errors.push('page must be a positive integer.')
  }
  if (query.limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    errors.push('limit must be an integer between 1 and 100.')
  }
  if (status && !ORDER_STATUSES.has(status)) {
    errors.push('status must be a valid order status.')
  }

  request.validatedQuery = {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20,
    status: status || null,
  }
  return errors
}

export function validateAdminOrderStatus(request) {
  const errors = []
  const orderNumber = asTrimmedString(request.params.orderNumber)
  const status = asTrimmedString(request.body?.status)

  if (!orderNumber || !ORDER_NUMBER_PATTERN.test(orderNumber)) {
    errors.push('orderNumber is invalid.')
  }
  if (!ORDER_STATUSES.has(status)) {
    errors.push('status must be one of: pending, confirmed, processing, shipped, completed, cancelled, refunded.')
  }

  request.validatedParams = { orderNumber }
  request.validatedBody = { status }
  return errors
}
