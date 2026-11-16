import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/healthRoutes.js'
import productRoutes, { adminProductRouter, categoryRouter } from './routes/productRoutes.js'
import { ensureUploadDirectories, uploadsRoot } from './config/uploads.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

ensureUploadDirectories()

const app = express()
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    // Permit non-browser tools such as curl, while restricting browser origins.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS.'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))
app.use(express.json({ limit: '200kb' }))
app.use('/uploads', express.static(uploadsRoot, {
  fallthrough: true,
  index: false,
  setHeaders(response) {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Cache-Control', 'public, max-age=86400')
  },
}))

app.get('/', (_request, response) => {
  response.json({ service: 'haunt-store-api', message: 'HΛUNT API is running.' })
})
app.use('/api/health', healthRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRouter)
app.use('/api/admin/products', adminProductRouter)

app.use(notFound)
app.use(errorHandler)

export default app
