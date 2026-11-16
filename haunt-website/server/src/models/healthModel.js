import { pool } from '../config/database.js'

export async function checkDatabaseConnection() {
  if (!pool) return false
  const connection = await pool.getConnection()
  try {
    await connection.query('SELECT 1')
    return true
  } finally {
    connection.release()
  }
}
