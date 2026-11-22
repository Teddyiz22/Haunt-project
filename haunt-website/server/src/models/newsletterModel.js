import { pool } from '../config/database.js'
import { HttpError } from '../utils/httpError.js'

function getPool() {
  if (!pool) throw new HttpError(503, 'Database is unavailable.')
  return pool
}

// Returns { subscribed: true } for a new address and
// { subscribed: false, already: true } for one already on the list.
// The caller answers both the same friendly way.
export async function subscribeEmail(email, source = 'website') {
  const db = getPool()
  const [result] = await db.query(
    `INSERT INTO newsletter_subscribers (email, source)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE email = email`,
    [email, source],
  )
  return { subscribed: result.affectedRows === 1, already: result.affectedRows !== 1 }
}

export async function countSubscribers() {
  const db = getPool()
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM newsletter_subscribers')
  return Number(rows[0]?.total || 0)
}
