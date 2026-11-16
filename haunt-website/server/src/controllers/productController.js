import fs from 'node:fs/promises'
import { assertImageMagicBytes } from '../middleware/productImageUpload.js'
import * as productService from '../services/productService.js'

async function discardInvalidUploads(files = []) {
  await Promise.all(files.map(async (file) => {
    try {
      await fs.unlink(file.path)
    } catch {
      // The request is already failing; ignore cleanup races.
    }
  }))
}

export async function listProducts(request, response) {
  const result = await productService.listPublicProducts(request.validatedQuery)
  response.json({ success: true, ...result })
}

export async function getProduct(request, response) {
  const product = await productService.getPublicProductBySlug(request.validatedParams.slug)
  response.json({ success: true, data: product })
}

export async function listCategories(_request, response) {
  const data = await productService.listCategories()
  response.json({ success: true, data })
}

export async function createProduct(request, response) {
  const product = await productService.createProduct(request.validatedBody)
  response.status(201).json({ success: true, data: product })
}

export async function updateProduct(request, response) {
  const product = await productService.updateProduct(request.validatedParams.id, request.validatedBody)
  response.json({ success: true, data: product })
}

export async function deleteProduct(request, response) {
  const hard = request.query.hard === 'true'
  const result = await productService.removeProduct(request.validatedParams.id, { hard })
  response.json({ success: true, data: result })
}

export async function getAdminProduct(request, response) {
  const product = await productService.getAdminProduct(request.validatedParams.id)
  response.json({ success: true, data: product })
}

export async function uploadProductImages(request, response, next) {
  try {
    for (const file of request.files || []) {
      await assertImageMagicBytes(file.path)
    }
  } catch (error) {
    await discardInvalidUploads(request.files)
    return next(error)
  }

  const data = await productService.addProductImages(request.validatedParams.id, request.files, {
    altText: request.body?.alt_text,
  })
  response.status(201).json({ success: true, data })
}

export async function deleteProductImage(request, response) {
  const imageId = Number.parseInt(request.params.imageId, 10)
  const result = await productService.removeProductImage(request.validatedParams.id, imageId)
  response.json({ success: true, data: result })
}
