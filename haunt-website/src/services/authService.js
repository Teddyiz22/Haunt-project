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
      payload.error || 'The account request failed.',
    )
    if (Array.isArray(payload.details)) error.details = payload.details
    throw error
  }
  return payload
}

export function registerAccount(payload) {
  return apiRequest('/auth/register', { method: 'POST', body: payload })
}

export function loginAccount(payload) {
  return apiRequest('/auth/login', { method: 'POST', body: payload })
}

export function getCurrentUser(token) {
  return apiRequest('/auth/me', { token })
}
