import { randomInt } from 'node:crypto'
import { pool } from '../config/database.js'
import { HttpError } from '../utils/httpError.js'
import { withTransaction } from './productModel.js'

function getPool() {
  if (!pool) throw new HttpError(503, 'Database is unavailable.')
  return pool
}

// Money is handled in integer MMK cents inside the transaction so totals are
// exact; prices always come from the database, never from the client.
function toCents(decimalValue) {
  return Math.round(Number(decimalValue) * 100)
}

function fromCents(cents) {
  return Number((cents / 100).toFixed(2))
}

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `HNT-${date}-${String(randomInt(1000, 10000))}`
}

function isDuplicateKey(error) {
  return error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062)
}

function presentOrder(order, items) {
  return {
    orderNumber: order.order_number,
    status: order.status,
    currency: order.currency,
    subtotal: fromCents(toCents(order.subtotal)),
    shippingTotal: fromCents(toCents(order.shipping_total)),
    discountTotal: fromCents(toCents(order.discount_total)),
    grandTotal: fromCents(toCents(order.grand_total)),
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    paymentMethod: order.payment_method,
    placedAt: order.placed_at,
    address: {
      addressLine1: order.shipping_address_line_1,
      addressLine2: order.shipping_address_line_2,
      city: order.shipping_city,
      region: order.shipping_region,
      postalCode: order.shipping_postal_code,
      countryCode: order.shipping_country_code,
    },
    items: items.map((item) => ({
      variantId: item.variant_id,
      productName: item.product_name_snapshot,
      sku: item.sku_snapshot,
      size: item.size_snapshot,
      unitPrice: fromCents(toCents(item.unit_price)),
      quantity: item.quantity,
      lineTotal: fromCents(toCents(item.line_total)),
    })),
  }
}

export async function createGuestOrder({ customer, items }) {
  return withTransaction(async (connection) => {
    // Resolve every line from the database, locking the variant rows so two
    // checkouts cannot oversell the same stock.
    const lines = []
    let subtotalCents = 0

    for (const item of items) {
      const [rows] = await connection.query(
        `SELECT
            v.id AS variant_id, v.size, v.sku AS variant_sku, v.stock_quantity,
            v.is_active AS variant_active,
            p.id AS product_id, p.name AS product_name, p.sku AS product_sku,
            p.price_mmk, p.is_active AS product_active
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE v.id = ?
         FOR UPDATE`,
        [item.variantId],
      )
      const row = rows[0]
      if (!row) throw new HttpError(400, `Variant ${item.variantId} was not found.`)
      if (!row.product_active || !row.variant_active) {
        throw new HttpError(400, `${row.product_name} (${row.size}) is no longer available.`)
      }
      if (row.stock_quantity < item.quantity) {
        throw new HttpError(
          400,
          `Only ${row.stock_quantity} left of ${row.product_name} (${row.size}).`,
        )
      }
      const unitPriceCents = toCents(row.price_mmk)
      const lineTotalCents = unitPriceCents * item.quantity
      subtotalCents += lineTotalCents
      lines.push({
        variantId: row.variant_id,
        size: row.size,
        productName: row.product_name,
        sku: row.variant_sku || row.product_sku,
        unitPriceCents,
        quantity: item.quantity,
        lineTotalCents,
      })
    }

    const shippingCents = 0
    const discountCents = 0
    const grandTotalCents = subtotalCents + shippingCents - discountCents

    // Insert the order, retrying the order number on the rare duplicate.
    let orderId = null
    let orderNumber = null
    for (let attempt = 0; attempt < 5; attempt += 1) {
      orderNumber = generateOrderNumber()
      try {
        const [result] = await connection.query(
          `INSERT INTO orders (
              order_number, user_id, shipping_address_id, status, currency,
              subtotal, shipping_total, discount_total, grand_total,
              customer_email, customer_name, customer_phone,
              shipping_address_line_1, shipping_address_line_2, shipping_city,
              shipping_region, shipping_postal_code, shipping_country_code,
              payment_method, placed_at
           ) VALUES (?, NULL, NULL, 'pending', 'MMK', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cash_on_delivery', NOW())`,
          [
            orderNumber,
            fromCents(subtotalCents),
            fromCents(shippingCents),
            fromCents(discountCents),
            fromCents(grandTotalCents),
            customer.email,
            customer.name,
            customer.phone,
            customer.addressLine1,
            customer.addressLine2 || null,
            customer.city,
            customer.region || null,
            customer.postalCode || null,
            customer.countryCode,
          ],
        )
        orderId = result.insertId
        break
      } catch (error) {
        if (isDuplicateKey(error) && attempt < 4) continue
        throw error
      }
    }

    for (const line of lines) {
      await connection.query(
        `INSERT INTO order_items (
            order_id, variant_id, product_name_snapshot, sku_snapshot,
            size_snapshot, unit_price, quantity, line_total
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          line.variantId,
          line.productName,
          line.sku,
          line.size,
          fromCents(line.unitPriceCents),
          line.quantity,
          fromCents(line.lineTotalCents),
        ],
      )
      const [updateResult] = await connection.query(
        `UPDATE product_variants
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?`,
        [line.quantity, line.variantId, line.quantity],
      )
      if (updateResult.affectedRows !== 1) {
        throw new HttpError(
          400,
          `Only limited stock remains of ${line.productName} (${line.size}).`,
        )
      }
    }

    await connection.query(
      `INSERT INTO payments (order_id, provider, provider_reference, status, amount, currency)
       VALUES (?, 'cash_on_delivery', NULL, 'pending', ?, 'MMK')`,
      [orderId, fromCents(grandTotalCents)],
    )

    return {
      orderNumber,
      status: 'pending',
      subtotal: fromCents(subtotalCents),
      shippingTotal: fromCents(shippingCents),
      discountTotal: fromCents(discountCents),
      grandTotal: fromCents(grandTotalCents),
      customerEmail: customer.email,
      items: lines.map((line) => ({
        variantId: line.variantId,
        productName: line.productName,
        sku: line.sku,
        size: line.size,
        unitPrice: fromCents(line.unitPriceCents),
        quantity: line.quantity,
        lineTotal: fromCents(line.lineTotalCents),
      })),
    }
  })
}

export async function listOrdersByEmail(email, { limit = 50 } = {}) {
  const db = getPool()
  const [rows] = await db.query(
    `SELECT
        o.order_number, o.status, o.currency, o.subtotal, o.shipping_total,
        o.discount_total, o.grand_total, o.customer_email, o.customer_name,
        o.payment_method, o.placed_at,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT GROUP_CONCAT(oi.product_name_snapshot SEPARATOR ', ')
         FROM order_items oi WHERE oi.order_id = o.id) AS item_names
     FROM orders o
     WHERE LOWER(o.customer_email) = LOWER(?)
     ORDER BY o.placed_at DESC, o.id DESC
     LIMIT ?`,
    [email, limit],
  )
  return rows.map((row) => ({
    orderNumber: row.order_number,
    status: row.status,
    currency: row.currency,
    subtotal: fromCents(toCents(row.subtotal)),
    shippingTotal: fromCents(toCents(row.shipping_total)),
    discountTotal: fromCents(toCents(row.discount_total)),
    grandTotal: fromCents(toCents(row.grand_total)),
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    paymentMethod: row.payment_method,
    placedAt: row.placed_at,
    itemCount: Number(row.item_count || 0),
    itemNames: row.item_names || '',
  }))
}

const ORDER_STATUSES = new Set([
  'pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled', 'refunded',
])

export function isOrderStatus(value) {
  return ORDER_STATUSES.has(value)
}

export async function listOrdersAdmin({ status = null, page = 1, limit = 20 } = {}) {
  const db = getPool()
  const where = []
  const params = []
  if (status) {
    where.push('o.status = ?')
    params.push(status)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM orders o ${whereSql}`,
    params,
  )
  const [rows] = await db.query(
    `SELECT
        o.order_number, o.status, o.currency, o.subtotal, o.shipping_total,
        o.discount_total, o.grand_total, o.customer_email, o.customer_name,
        o.customer_phone, o.payment_method, o.placed_at,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT GROUP_CONCAT(oi.product_name_snapshot SEPARATOR ', ')
         FROM order_items oi WHERE oi.order_id = o.id) AS item_names
     FROM orders o
     ${whereSql}
     ORDER BY o.placed_at DESC, o.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  )
  return {
    total: Number(countRows[0]?.total || 0),
    orders: rows.map((row) => ({
      orderNumber: row.order_number,
      status: row.status,
      currency: row.currency,
      subtotal: fromCents(toCents(row.subtotal)),
      shippingTotal: fromCents(toCents(row.shipping_total)),
      discountTotal: fromCents(toCents(row.discount_total)),
      grandTotal: fromCents(toCents(row.grand_total)),
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      paymentMethod: row.payment_method,
      placedAt: row.placed_at,
      itemCount: Number(row.item_count || 0),
      itemNames: row.item_names || '',
    })),
  }
}

export async function updateOrderStatus(orderNumber, status) {
  const db = getPool()
  const [result] = await db.query(
    'UPDATE orders SET status = ? WHERE order_number = ?',
    [status, orderNumber],
  )
  return result.affectedRows
}

export async function findOrderByNumber(orderNumber, email) {
  const db = getPool()
  // The email must match (case-insensitive); a miss returns null so the
  // caller answers 404 either way and never reveals the order exists.
  const [orderRows] = await db.query(
    `SELECT
        order_number, status, currency, subtotal, shipping_total,
        discount_total, grand_total, customer_email, customer_name,
        customer_phone, payment_method, placed_at,
        shipping_address_line_1, shipping_address_line_2, shipping_city,
        shipping_region, shipping_postal_code, shipping_country_code
     FROM orders
     WHERE order_number = ? AND LOWER(customer_email) = LOWER(?)
     LIMIT 1`,
    [orderNumber, email],
  )
  const order = orderRows[0]
  if (!order) return null

  const [itemRows] = await db.query(
    `SELECT variant_id, product_name_snapshot, sku_snapshot, size_snapshot,
            unit_price, quantity, line_total
     FROM order_items
     WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)
     ORDER BY id ASC`,
    [orderNumber],
  )
  return presentOrder(order, itemRows)
}
