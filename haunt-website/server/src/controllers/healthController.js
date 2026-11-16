import { getHealth } from '../services/healthService.js'

export async function healthController(_request, response) {
  const health = await getHealth()
  response.status(health.status === 'ok' ? 200 : 503).json({
    success: health.status === 'ok',
    service: 'haunt-store-api',
    ...health,
    timestamp: new Date().toISOString(),
  })
}
