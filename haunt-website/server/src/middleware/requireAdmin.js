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
// Step 11 populates request.user from a JWT via optionalAuthenticate, which
// runs before this middleware on admin routes. Writes are still denied
// unless the request carries an admin JWT or ADMIN_API_TOKEN is configured
// and sent. An empty token never grants access.
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
