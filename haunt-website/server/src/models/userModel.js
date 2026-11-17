import bcrypt from 'bcrypt'
import { pool } from '../config/database.js'
import { HttpError } from '../utils/httpError.js'

const BCRYPT_COST = 12

function getPool() {
  if (!pool) throw new HttpError(503, 'Database is unavailable.')
  return pool
}

// The full row, including password_hash, is only for server-side checks.
// It must never be sent to a client; authService.serializeUser strips it.
export async function findUserByEmail(email) {
  const db = getPool()
  const [rows] = await db.query(
    `SELECT id, email, password_hash, first_name, last_name, role, is_active,
            created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  )
  return rows[0] || null
}

export async function findUserById(id) {
  const db = getPool()
  const [rows] = await db.query(
    `SELECT id, email, password_hash, first_name, last_name, role, is_active,
            created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

export async function insertUser({ first_name, last_name, email, password, role = 'customer' }) {
  const db = getPool()
  const password_hash = await bcrypt.hash(password, BCRYPT_COST)
  const [result] = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [email, password_hash, first_name, last_name, role],
  )
  return result.insertId
}

export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false
  return bcrypt.compare(password, passwordHash)
}
