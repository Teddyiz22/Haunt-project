import { API_BASE_URL } from '../config/api.js'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function apiGet(path) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`)
  } catch {
    throw new ApiError(0, 'Unable to reach the HΛUNT API.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    throw new ApiError(response.status, payload.error || 'The catalog request failed.')
  }
  return payload
}

function toSearchParams(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  return params.toString()
}

export function getProducts(filters = {}) {
  const query = toSearchParams(filters)
  return apiGet(`/products${query ? `?${query}` : ''}`)
}

export function getProductBySlug(slug) {
  return apiGet(`/products/${encodeURIComponent(slug)}`)
}

export function getCategories() {
  return apiGet('/categories')
}
