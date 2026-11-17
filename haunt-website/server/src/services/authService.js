import jwt from 'jsonwebtoken'
import { HttpError } from '../utils/httpError.js'
import * as userModel from '../models/userModel.js'

// The placeholder shipped in server/.env.example must never act as a real
// secret: treat it exactly like a missing JWT_SECRET.
const JWT_SECRET_PLACEHOLDER = 'replace_with_a_long_random_secret_at_least_32_chars'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === JWT_SECRET_PLACEHOLDER) return null
  return secret
}

export function isJwtConfigured() {
  return getJwtSecret() !== null
}

export function serializeUser(user) {
  if (!user) return null
  return {
    id: Number(user.id),
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

function issueToken(user) {
  const secret = getJwtSecret()
  if (!secret) {
    throw new HttpError(503, 'Authentication is unavailable. JWT_SECRET is not configured.')
  }
  return jwt.sign(
    { sub: user.id, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  )
}

export async function register(validatedBody) {
  const userId = await userModel.insertUser({
    first_name: validatedBody.first_name,
    last_name: validatedBody.last_name,
    email: validatedBody.email,
    password: validatedBody.password,
    role: 'customer',
  }).catch((error) => {
    // MySQL duplicate-key error on uq_users_email.
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'An account with this email already exists.')
    }
    throw error
  })

  const user = await userModel.findUserById(userId)
  return { user: serializeUser(user), token: issueToken(user) }
}

export async function login({ email, password }) {
  // One generic message for every mismatch, including an unknown email, so
  // the endpoint never reveals whether an email is registered.
  const genericError = new HttpError(401, 'Email or password is incorrect.')

  const user = await userModel.findUserByEmail(email)
  if (!user) throw genericError
  if (!user.is_active) throw genericError
  const passwordMatches = await userModel.verifyPassword(password, user.password_hash)
  if (!passwordMatches) throw genericError

  return { user: serializeUser(user), token: issueToken(user) }
}

export async function getAuthenticatedUser(userId) {
  const user = await userModel.findUserById(userId)
  if (!user || !user.is_active) {
    throw new HttpError(401, 'Authentication required.')
  }
  return serializeUser(user)
}
