import jwt from 'jsonwebtoken'
import { HttpError } from '../utils/httpError.js'
import { isJwtConfigured } from '../services/authService.js'
import * as userModel from '../models/userModel.js'

function readBearerToken(request) {
  const header = request.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() === 'bearer' && token) return token
  return ''
}

// Required authentication. Fail closed: no token, an invalid or expired
// token, an inactive or deleted user, or an unconfigured JWT_SECRET all
// reject the request — none of them ever lets it through as a guest.
export async function authenticate(request, _response, next) {
  try {
    if (!isJwtConfigured()) {
      throw new HttpError(503, 'Authentication is unavailable. JWT_SECRET is not configured.')
    }

    const token = readBearerToken(request)
    if (!token) throw new HttpError(401, 'Authentication required.')

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      throw new HttpError(401, 'Authentication required.')
    }

    const userId = Number(decoded?.sub)
    if (!Number.isInteger(userId) || userId < 1) {
      throw new HttpError(401, 'Authentication required.')
    }

    const user = await userModel.findUserById(userId)
    if (!user || !user.is_active) {
      throw new HttpError(401, 'Authentication required.')
    }

    request.user = {
      id: Number(user.id),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: Boolean(user.is_active),
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

// Optional authentication. Sets request.user only when a valid token for an
// active user is present; any other request continues as a guest. Used in
// front of requireAdmin so an admin JWT is accepted while the existing
// ADMIN_API_TOKEN fallback keeps working.
export async function optionalAuthenticate(request, _response, next) {
  try {
    if (!isJwtConfigured()) return next()

    const token = readBearerToken(request)
    if (!token) return next()

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return next()
    }

    const userId = Number(decoded?.sub)
    if (!Number.isInteger(userId) || userId < 1) return next()

    const user = await userModel.findUserById(userId)
    if (!user || !user.is_active) return next()

    request.user = {
      id: Number(user.id),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: Boolean(user.is_active),
    }
    return next()
  } catch {
    return next()
  }
}
