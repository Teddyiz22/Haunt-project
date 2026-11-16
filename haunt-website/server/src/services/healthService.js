import { checkDatabaseConnection } from '../models/healthModel.js'

export async function getHealth() {
  try {
    await checkDatabaseConnection()
    return { status: 'ok', database: 'connected' }
  } catch {
    return { status: 'degraded', database: 'disconnected' }
  }
}
