import fs from 'node:fs/promises'
import path from 'node:path'
import { HttpError } from '../utils/httpError.js'
import { resolveManagedUploadFile, toPublicImageUrl } from '../config/uploads.js'
import * as productModel from '../models/productModel.js'

function mapMysqlError(error) {
  if (error.status) return error
  if (error.code === 'ER_DUP_ENTRY') {
    return new HttpError(409, 'A product with this slug or SKU already exists.')
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new HttpError(400, 'Related category or product record was not found.')
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return new HttpError(503, 'Database is unavailable.')
  }
  return error
}

function serializeProduct(product, images = [], variants = []) {
  const inStock = variants.some((variant) => variant.is_active && Number(variant.stock_quantity) > 0)
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price_mmk: product.price_mmk,
    is_featured: Boolean(product.is_featured),
    is_active: Boolean(product.is_active),
    created_at: product.created_at,
    updated_at: product.updated_at,
    category: product.category_id
      ? {
          id: product.category_id,
          name: product.category_name,
          slug: product.category_slug,
        }
      : null,
    images: images.map((image) => ({
      id: image.id,
      url: toPublicImageUrl(image.image_url),
      alt_text: image.alt_text,
      sort_order: image.sort_order,
      is_primary: Boolean(image.is_primary),
    })),
    variants: variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      sku: variant.sku,
      stock_quantity: Number(variant.stock_quantity),
      is_active: Boolean(variant.is_active),
      available: Boolean(variant.is_active) && Number(variant.stock_quantity) > 0,
    })),
    in_stock: inStock,
  }
}

async function attachRelations(products) {
  const ids = products.map((product) => product.id)
  const [images, variants] = await Promise.all([
    productModel.findImagesByProductIds(ids),
    productModel.findVariantsByProductIds(ids),
  ])
  const imagesByProduct = new Map()
  const variantsByProduct = new Map()
  for (const image of images) {
    const list = imagesByProduct.get(image.product_id) || []
    list.push(image)
    imagesByProduct.set(image.product_id, list)
  }
  for (const variant of variants) {
    const list = variantsByProduct.get(variant.product_id) || []
    list.push(variant)
    variantsByProduct.set(variant.product_id, list)
  }
  return products.map((product) => serializeProduct(
    product,
    imagesByProduct.get(product.id) || [],
    variantsByProduct.get(product.id) || [],
  ))
}

async function assertCategory(categoryId) {
  if (!categoryId) return
  const category = await productModel.findCategoryById(categoryId)
  if (!category || !category.is_active) {
    throw new HttpError(400, 'Active category was not found.')
  }
}

async function removeManagedFiles(storedPaths) {
  await Promise.all(storedPaths.map(async (storedPath) => {
    const filePath = resolveManagedUploadFile(storedPath)
    if (!filePath) return
    try {
      await fs.unlink(filePath)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }))
}

export async function listPublicProducts(filters) {
  try {
    const { total, rows } = await productModel.listProducts(filters)
    const data = await attachRelations(rows)
    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / filters.limit)),
      },
    }
  } catch (error) {
    throw mapMysqlError(error)
  }
}

export async function getPublicProductBySlug(slug) {
  try {
    const product = await productModel.findProductBySlug(slug)
    if (!product) throw new HttpError(404, 'Product not found.')
    const [hydrated] = await attachRelations([product])
    return hydrated
  } catch (error) {
    throw mapMysqlError(error)
  }
}

export async function listCategories() {
  try {
    const rows = await productModel.listActiveCategories()
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
    }))
  } catch (error) {
    throw mapMysqlError(error)
  }
}

export async function getAdminProduct(id) {
  const product = await productModel.findProductById(id)
  if (!product) throw new HttpError(404, 'Product not found.')
  const [hydrated] = await attachRelations([product])
  return hydrated
}

export async function createProduct(payload) {
  try {
    await assertCategory(payload.category_id)
    const id = await productModel.withTransaction(async (connection) => {
      const productId = await productModel.insertProduct(connection, payload)
      if (payload.images.length) await productModel.replaceImages(connection, productId, payload.images)
      if (payload.variants.length) await productModel.replaceVariants(connection, productId, payload.variants)
      return productId
    })
    return getAdminProduct(id)
  } catch (error) {
    throw mapMysqlError(error)
  }
}

export async function updateProduct(id, payload) {
  try {
    const existing = await productModel.findProductById(id)
    if (!existing) throw new HttpError(404, 'Product not found.')
    await assertCategory(payload.category_id)

    const previousImages = payload.replaceImages
      ? await productModel.findImagesByProductIds([id])
      : []

    await productModel.withTransaction(async (connection) => {
      const affected = await productModel.updateProductRow(connection, id, payload)
      if (!affected) throw new HttpError(404, 'Product not found.')
      if (payload.replaceImages) await productModel.replaceImages(connection, id, payload.images)
      if (payload.replaceVariants) await productModel.replaceVariants(connection, id, payload.variants)
    })

    if (payload.replaceImages) {
      const remaining = new Set(payload.images.map((image) => image.image_url))
      await removeManagedFiles(
        previousImages.map((image) => image.image_url).filter((url) => !remaining.has(url)),
      )
    }

    return getAdminProduct(id)
  } catch (error) {
    throw mapMysqlError(error)
  }
}

export async function removeProduct(id, { hard = false } = {}) {
  try {
    const existing = await productModel.findProductById(id)
    if (!existing) throw new HttpError(404, 'Product not found.')

    if (!hard) {
      await productModel.deactivateProduct(id)
      return { id, deactivated: true }
    }

    const references = await productModel.countProductReferences(id)
    if (references.cartItems > 0 || references.orderItems > 0) {
      throw new HttpError(409, 'Product is referenced by carts or orders and cannot be permanently deleted. It was left unchanged; deactivate it instead.')
    }

    const images = await productModel.findImagesByProductIds([id])
    await productModel.withTransaction(async (connection) => {
      await productModel.deleteProductRow(connection, id)
    })
    await removeManagedFiles(images.map((image) => image.image_url))
    return { id, deleted: true }
  } catch (error) {
    throw mapMysqlError(error)
  }
}

export async function addProductImages(id, files, { altText } = {}) {
  const product = await productModel.findProductById(id)
  if (!product) throw new HttpError(404, 'Product not found.')
  if (!files?.length) throw new HttpError(400, 'At least one image file is required.')

  let sortOrder = await productModel.maxImageSortOrder(id)
  const stored = []
  for (const [index, file] of files.entries()) {
    sortOrder += 1
    const imageUrl = `/uploads/products/${path.basename(file.filename)}`
    const imageId = await productModel.insertImage(id, {
      image_url: imageUrl,
      alt_text: altText || null,
      sort_order: sortOrder,
      is_primary: sortOrder === 0 && index === 0,
    })
    stored.push({
      id: imageId,
      url: toPublicImageUrl(imageUrl),
      image_url: imageUrl,
    })
  }
  return stored
}

export async function removeProductImage(productId, imageId) {
  const image = await productModel.findImageById(productId, imageId)
  if (!image) throw new HttpError(404, 'Image not found.')
  await productModel.deleteImageById(productId, imageId)
  await removeManagedFiles([image.image_url])
  return { id: imageId, deleted: true }
}
