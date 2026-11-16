import { pool } from '../config/database.js'
import { HttpError } from '../utils/httpError.js'

function getPool() {
  if (!pool) throw new HttpError(503, 'Database is unavailable.')
  return pool
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&')
}

const SORT_SQL = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price_mmk ASC, p.id DESC',
  price_desc: 'p.price_mmk DESC, p.id DESC',
}

export async function withTransaction(work) {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await work(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

function buildPublicFilters(filters, { includeInactive = false } = {}) {
  const where = []
  const params = []

  if (!includeInactive) where.push('p.is_active = 1')

  if (filters.search) {
    where.push('p.name LIKE ?')
    params.push(`%${escapeLike(filters.search)}%`)
  }
  if (filters.category) {
    where.push('c.slug = ?')
    params.push(filters.category)
  }
  if (filters.minPrice !== null) {
    where.push('p.price_mmk >= ?')
    params.push(filters.minPrice)
  }
  if (filters.maxPrice !== null) {
    where.push('p.price_mmk <= ?')
    params.push(filters.maxPrice)
  }
  if (filters.size) {
    where.push(`EXISTS (
      SELECT 1 FROM product_variants v
      WHERE v.product_id = p.id
        AND v.size = ?
        AND v.is_active = 1
        AND v.stock_quantity > 0
    )`)
    params.push(filters.size)
  }
  if (filters.featured === true) where.push('p.is_featured = 1')
  if (filters.featured === false) where.push('p.is_featured = 0')

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  }
}

export async function listProducts(filters, { includeInactive = false } = {}) {
  const db = getPool()
  const { whereSql, params } = buildPublicFilters(filters, { includeInactive })
  const orderSql = SORT_SQL[filters.sort] || SORT_SQL.newest
  const offset = (filters.page - 1) * filters.limit

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}`,
    params,
  )

  const [rows] = await db.query(
    `SELECT
        p.id, p.category_id, p.name, p.slug, p.description, p.sku, p.price_mmk,
        p.is_featured, p.is_active, p.created_at, p.updated_at,
        c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY ${orderSql}
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset],
  )

  return { total: Number(countRows[0]?.total || 0), rows }
}

export async function findProductBySlug(slug, { includeInactive = false } = {}) {
  const db = getPool()
  const [rows] = await db.query(
    `SELECT
        p.id, p.category_id, p.name, p.slug, p.description, p.sku, p.price_mmk,
        p.is_featured, p.is_active, p.created_at, p.updated_at,
        c.name AS category_name, c.slug AS category_slug, c.is_active AS category_is_active
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? ${includeInactive ? '' : 'AND p.is_active = 1'}
     LIMIT 1`,
    [slug],
  )
  return rows[0] || null
}

export async function findProductById(id) {
  const db = getPool()
  const [rows] = await db.query(
    `SELECT
        p.id, p.category_id, p.name, p.slug, p.description, p.sku, p.price_mmk,
        p.is_featured, p.is_active, p.created_at, p.updated_at,
        c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?
     LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

export async function findImagesByProductIds(productIds) {
  if (!productIds.length) return []
  const db = getPool()
  const [rows] = await db.query(
    `SELECT id, product_id, image_url, alt_text, sort_order, is_primary
     FROM product_images
     WHERE product_id IN (?)
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [productIds],
  )
  return rows
}

export async function findVariantsByProductIds(productIds, { inStockOnly = false } = {}) {
  if (!productIds.length) return []
  const db = getPool()
  const stockClause = inStockOnly ? 'AND stock_quantity > 0 AND is_active = 1' : ''
  const [rows] = await db.query(
    `SELECT id, product_id, size, sku, stock_quantity, is_active
     FROM product_variants
     WHERE product_id IN (?) ${stockClause}
     ORDER BY FIELD(size, 'XS', 'S', 'M', 'L', 'XL', 'XXL'), size ASC, id ASC`,
    [productIds],
  )
  return rows
}

export async function listActiveCategories() {
  const db = getPool()
  const [rows] = await db.query(
    `SELECT id, name, slug, description
     FROM categories
     WHERE is_active = 1
     ORDER BY name ASC`,
  )
  return rows
}

export async function findCategoryById(id) {
  if (!id) return null
  const db = getPool()
  const [rows] = await db.query(
    'SELECT id, name, slug, is_active FROM categories WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] || null
}

export async function insertProduct(connection, product) {
  const [result] = await connection.query(
    `INSERT INTO products
      (category_id, name, slug, description, sku, price_mmk, is_featured, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.category_id,
      product.name,
      product.slug,
      product.description,
      product.sku,
      product.price_mmk,
      product.is_featured,
      product.is_active,
    ],
  )
  return result.insertId
}

export async function updateProductRow(connection, id, product) {
  const [result] = await connection.query(
    `UPDATE products
     SET category_id = ?, name = ?, slug = ?, description = ?, sku = ?,
         price_mmk = ?, is_featured = ?, is_active = ?
     WHERE id = ?`,
    [
      product.category_id,
      product.name,
      product.slug,
      product.description,
      product.sku,
      product.price_mmk,
      product.is_featured,
      product.is_active,
      id,
    ],
  )
  return result.affectedRows
}

export async function deactivateProduct(id) {
  const db = getPool()
  const [result] = await db.query(
    'UPDATE products SET is_active = 0, is_featured = 0 WHERE id = ?',
    [id],
  )
  return result.affectedRows
}

export async function countProductReferences(id) {
  const db = getPool()
  const [cartRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM cart_items ci
     INNER JOIN product_variants v ON v.id = ci.variant_id
     WHERE v.product_id = ?`,
    [id],
  )
  const [orderRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM order_items oi
     INNER JOIN product_variants v ON v.id = oi.variant_id
     WHERE v.product_id = ?`,
    [id],
  )
  return {
    cartItems: Number(cartRows[0]?.total || 0),
    orderItems: Number(orderRows[0]?.total || 0),
  }
}

export async function deleteProductRow(connection, id) {
  const [result] = await connection.query('DELETE FROM products WHERE id = ?', [id])
  return result.affectedRows
}

export async function replaceImages(connection, productId, images) {
  await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId])
  if (!images.length) return
  const values = images.map((image) => [
    productId,
    image.image_url,
    image.alt_text,
    image.sort_order,
    image.is_primary,
  ])
  await connection.query(
    `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
     VALUES ?`,
    [values],
  )
}

export async function insertImage(productId, image) {
  const db = getPool()
  const [result] = await db.query(
    `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
     VALUES (?, ?, ?, ?, ?)`,
    [productId, image.image_url, image.alt_text, image.sort_order, image.is_primary],
  )
  return result.insertId
}

export async function findImageById(productId, imageId) {
  const db = getPool()
  const [rows] = await db.query(
    'SELECT id, product_id, image_url FROM product_images WHERE product_id = ? AND id = ? LIMIT 1',
    [productId, imageId],
  )
  return rows[0] || null
}

export async function deleteImageById(productId, imageId) {
  const db = getPool()
  const [result] = await db.query(
    'DELETE FROM product_images WHERE product_id = ? AND id = ?',
    [productId, imageId],
  )
  return result.affectedRows
}

export async function maxImageSortOrder(productId) {
  const db = getPool()
  const [rows] = await db.query(
    'SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM product_images WHERE product_id = ?',
    [productId],
  )
  return Number(rows[0]?.max_sort ?? -1)
}

export async function replaceVariants(connection, productId, variants) {
  const [existing] = await connection.query(
    'SELECT id, size FROM product_variants WHERE product_id = ?',
    [productId],
  )
  const existingBySize = new Map(existing.map((row) => [row.size, row]))
  const incomingSizes = new Set(variants.map((variant) => variant.size))

  for (const variant of variants) {
    const current = existingBySize.get(variant.size)
    if (current) {
      await connection.query(
        `UPDATE product_variants
         SET sku = ?, stock_quantity = ?, is_active = ?
         WHERE id = ?`,
        [variant.sku, variant.stock_quantity, variant.is_active, current.id],
      )
    } else {
      await connection.query(
        `INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [productId, variant.size, variant.sku, variant.stock_quantity, variant.is_active],
      )
    }
  }

  const removable = existing.filter((row) => !incomingSizes.has(row.size))
  for (const row of removable) {
    const [cartRows] = await connection.query(
      'SELECT COUNT(*) AS total FROM cart_items WHERE variant_id = ?',
      [row.id],
    )
    const [orderRows] = await connection.query(
      'SELECT COUNT(*) AS total FROM order_items WHERE variant_id = ?',
      [row.id],
    )
    if (Number(cartRows[0].total) > 0 || Number(orderRows[0].total) > 0) {
      await connection.query(
        'UPDATE product_variants SET is_active = 0, stock_quantity = 0 WHERE id = ?',
        [row.id],
      )
    } else {
      await connection.query('DELETE FROM product_variants WHERE id = ?', [row.id])
    }
  }
}
