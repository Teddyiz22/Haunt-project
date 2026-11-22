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

// Auth error display (same lesson as the Edu Flow fix): the page must never
// go silent, and a server/setup failure must say so in plain words.
// - status 0 / 503 / 500: the real API message plus a plain-language hint
//   that this is a store problem, not the account.
// - 401: keep the API's generic message — it never says whether the email
//   exists, and neither do we.
// - 400 / 409: show the API message and its validation details.
export function describeAuthError(error) {
  const status = Number(error?.status)
  const message = error?.message || 'Sign-in failed.'
  const details = Array.isArray(error?.details) ? error.details : []

  if (status === 0) {
    return {
      message: 'Unable to reach the HΛUNT API.',
      hint: 'The store server is not running or cannot be reached. Check that the API is up, then try again.',
      details,
    }
  }
  if (status === 503 || status >= 500) {
    return {
      message,
      hint: 'This is a problem with the store, not your account. Please try again later.',
      details,
    }
  }
  return { message, hint: '', details }
}
