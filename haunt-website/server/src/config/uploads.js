import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const uploadsRoot = path.resolve(__dirname, '../../uploads')
export const productUploadsDir = path.join(uploadsRoot, 'products')
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_PRODUCT_IMAGES_PER_REQUEST = 8
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])
export const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export function ensureUploadDirectories() {
  fs.mkdirSync(productUploadsDir, { recursive: true })
}

export function getPublicBaseUrl() {
  return (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')
}

export function toPublicImageUrl(storedPath) {
  if (!storedPath) return null
  if (/^https?:\/\//i.test(storedPath)) return storedPath
  const normalized = storedPath.startsWith('/') ? storedPath : `/${storedPath}`
  const base = getPublicBaseUrl()
  return base ? `${base}${normalized}` : normalized
}

export function isManagedUploadPath(storedPath) {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) return false
  const relative = storedPath.replace(/^\/+/, '')
  const absolute = path.resolve(uploadsRoot, path.relative('uploads', relative))
  return absolute.startsWith(productUploadsDir + path.sep)
}

export function resolveManagedUploadFile(storedPath) {
  if (!isManagedUploadPath(storedPath)) return null
  const relative = storedPath.replace(/^\/+/, '')
  return path.resolve(uploadsRoot, path.relative('uploads', relative))
}
