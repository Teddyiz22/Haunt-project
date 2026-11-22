import { API_BASE_URL } from '../config/api.js'
import { ApiError } from './productService.js'

async function adminRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Unable to reach the HΛUNT API.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    const error = new ApiError(response.status, payload.error || 'The admin request failed.')
    if (Array.isArray(payload.details)) error.details = payload.details
    throw error
  }
  return payload
}

export function getAdminOrders(token, filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  const query = params.toString()
  return adminRequest(`/admin/orders${query ? `?${query}` : ''}`, { token })
}

export function updateOrderStatus(token, orderNumber, status) {
  return adminRequest(`/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  })
}

export function getAdminProduct(token, id) {
  return adminRequest(`/admin/products/${id}`, { token })
}

// Price and stock are edited through the existing product write endpoint,
// which takes the full product body (name, slug, sku, price, variants).
export function updateAdminProduct(token, id, product) {
  return adminRequest(`/admin/products/${id}`, {
    method: 'PUT',
    body: product,
    token,
  })
}
