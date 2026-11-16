import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES_PER_REQUEST,
  ensureUploadDirectories,
  productUploadsDir,
} from '../config/uploads.js'
import { HttpError } from '../utils/httpError.js'

const MAGIC_SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', asciiOffset: 8, ascii: 'WEBP' },
]

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    ensureUploadDirectories()
    callback(null, productUploadsDir)
  },
  filename(_request, file, callback) {
    const extension = path.extname(file.originalname || '').toLowerCase()
    callback(null, `${crypto.randomUUID()}${extension}`)
  },
})

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_PRODUCT_IMAGE_BYTES,
    files: MAX_PRODUCT_IMAGES_PER_REQUEST,
  },
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname || '').toLowerCase()
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype) || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      return callback(new HttpError(400, 'Only JPEG, PNG, and WebP images are allowed.'))
    }
    return callback(null, true)
  },
}).array('images', MAX_PRODUCT_IMAGES_PER_REQUEST)

export async function assertImageMagicBytes(filePath) {
  const handle = await fs.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(16)
    await handle.read(buffer, 0, 16, 0)
    const isJpeg = MAGIC_SIGNATURES[0].bytes.every((byte, index) => buffer[index] === byte)
    const isPng = MAGIC_SIGNATURES[1].bytes.every((byte, index) => buffer[index] === byte)
    const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
    if (!isJpeg && !isPng && !isWebp) {
      throw new HttpError(400, 'File content is not a permitted image type.')
    }
  } finally {
    await handle.close()
  }
}
