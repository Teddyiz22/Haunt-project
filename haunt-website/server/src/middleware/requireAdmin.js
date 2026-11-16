import { createHash, timingSafeEqual } from 'node:crypto'

function readBearerToken(request) {
  const header = request.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() === 'bearer' && token) return token
  return ''
}

function tokensEqual(provided, expected) {
  const providedHash = createHash('sha256').update(String(provided)).digest()
  const expectedHash = createHash('sha256').update(String(expected)).digest()
  return timingSafeEqual(providedHash, expectedHash)
}

// Fail-closed administrator gate.
// Step 11 will populate request.user from JWT. Until then, writes are denied
// unless ADMIN_API_TOKEN is configured and sent. An empty token never grants access.
export function requireAdmin(request, response, next) {
  if (request.user?.role === 'admin' && request.user?.is_active !== false) {
    return next()
  }

  const configuredToken = process.env.ADMIN_API_TOKEN
  const providedToken = request.get('x-admin-token') || readBearerToken(request)

  if (configuredToken && providedToken && tokensEqual(providedToken, configuredToken)) {
    request.user = { role: 'admin', authMethod: 'admin-token' }
    return next()
  }

  return response.status(401).json({
    success: false,
    error: 'Administrator authorization required.',
  })
}
