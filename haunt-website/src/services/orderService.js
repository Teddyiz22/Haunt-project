import { API_BASE_URL } from '../config/api.js'
import { ApiError } from './productService.js'

async function apiRequest(path, { method = 'GET', body, token } = {}) {
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
    const error = new ApiError(
      response.status,
      payload.error || 'The order request failed.',
    )
    if (Array.isArray(payload.details)) error.details = payload.details
    throw error
  }
  return payload
}

export function createOrder(payload) {
  return apiRequest('/orders', { method: 'POST', body: payload })
}

export function getOrderByNumber(orderNumber, email) {
  const query = new URLSearchParams({ email })
  return apiRequest(`/orders/${encodeURIComponent(orderNumber)}?${query.toString()}`)
}

export function getMyOrders(token) {
  return apiRequest('/orders/mine', { token })
}
