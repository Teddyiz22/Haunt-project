USE haunt_store;

-- Sample dataset (DEMO ONLY — not live inventory). Extends 010_demo_catalog.sql.
-- Safe to re-run: products/categories upsert by unique slug/SKU, orders upsert by
-- unique order number, order items/payments insert only when missing, and variant
-- stock is set to absolute values (not decremented), so re-running changes nothing.
--
-- What it adds:
--   1 new category (Accessories) and 5 sample products with sizes and stock,
--   including one fully sold-out product to test the "Sold through" state.
--   2 sample orders with items and payments, so the order lookup
--   (GET /api/orders/:orderNumber?email=) can be tested without placing an order.
--   Sample orders buy ONLY the new sample products, so the 010 demo stock
--   (Eyes of Life Tee M = 15) is left untouched for the end-to-end order test.
--   No product images are inserted: sample product photos are still an open task.

-- 1. Extra category
INSERT INTO categories (name, slug, description, is_active)
VALUES
  ('Accessories', 'accessories', 'Caps, bags and small goods. Sample data.', TRUE)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  is_active = VALUES(is_active);

-- 2. Sample products
INSERT INTO products (
  category_id, name, slug, description, sku, price_mmk, is_featured, is_active
)
SELECT c.id,
  'HΛUNT — VOID TEE',
  'haunt-void-tee',
  'Black everyday tee. Sample listing — not live stock.',
  'HAUNT-VOID-TEE',
  42000.00,
  FALSE,
  TRUE
FROM categories c
WHERE c.slug = 'tees'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category_id = VALUES(category_id),
  price_mmk = VALUES(price_mmk),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);

INSERT INTO products (
  category_id, name, slug, description, sku, price_mmk, is_featured, is_active
)
SELECT c.id,
  'HΛUNT — EYES OF LIFE HOODIE',
  'haunt-eyes-of-life-hoodie',
  'Heavyweight hoodie with the Eyes of Life mark. Sample listing — not live stock.',
  'HAUNT-EOL-HOOD',
  95000.00,
  TRUE,
  TRUE
FROM categories c
WHERE c.slug = 'outerwear'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category_id = VALUES(category_id),
  price_mmk = VALUES(price_mmk),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);

INSERT INTO products (
  category_id, name, slug, description, sku, price_mmk, is_featured, is_active
)
SELECT c.id,
  'HΛUNT — STAY CAP',
  'haunt-stay-cap',
  'Black cap with red H. One size. Sample listing — not live stock.',
  'HAUNT-STAY-CAP',
  25000.00,
  FALSE,
  TRUE
FROM categories c
WHERE c.slug = 'accessories'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category_id = VALUES(category_id),
  price_mmk = VALUES(price_mmk),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);

INSERT INTO products (
  category_id, name, slug, description, sku, price_mmk, is_featured, is_active
)
SELECT c.id,
  'HΛUNT — HAUNT TOTE BAG',
  'haunt-tote-bag',
  'Canvas tote. One size. Sample listing — not live stock.',
  'HAUNT-TOTE',
  18000.00,
  FALSE,
  TRUE
FROM categories c
WHERE c.slug = 'accessories'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category_id = VALUES(category_id),
  price_mmk = VALUES(price_mmk),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);

INSERT INTO products (
  category_id, name, slug, description, sku, price_mmk, is_featured, is_active
)
SELECT c.id,
  'HΛUNT — EYES OF LIFE LONGSLEEVE',
  'haunt-eyes-of-life-longsleeve',
  'Sold-out sample product used to confirm the shop shows the sold-through state.',
  'HAUNT-EOL-LS',
  55000.00,
  FALSE,
  TRUE
FROM categories c
WHERE c.slug = 'tees'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category_id = VALUES(category_id),
  price_mmk = VALUES(price_mmk),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);

-- 3. Variants. Stock is absolute (final) values: the two sample orders in §4
-- already account for their quantities (VOID TEE M was 12, minus 2 = 10;
-- VOID TEE L was 12, minus 1 = 11; STAY CAP was 20, minus 1 = 19).
INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'S' AS size, 'HAUNT-VOID-TEE-S' AS sku, 8 AS stock_quantity
  UNION ALL SELECT 'M', 'HAUNT-VOID-TEE-M', 10
  UNION ALL SELECT 'L', 'HAUNT-VOID-TEE-L', 11
  UNION ALL SELECT 'XL', 'HAUNT-VOID-TEE-XL', 6
) v
WHERE p.slug = 'haunt-void-tee'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;

INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'S' AS size, 'HAUNT-EOL-HOOD-S' AS sku, 5 AS stock_quantity
  UNION ALL SELECT 'M', 'HAUNT-EOL-HOOD-M', 8
  UNION ALL SELECT 'L', 'HAUNT-EOL-HOOD-L', 8
  UNION ALL SELECT 'XL', 'HAUNT-EOL-HOOD-XL', 4
) v
WHERE p.slug = 'haunt-eyes-of-life-hoodie'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;

INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'OS' AS size, 'HAUNT-STAY-CAP-OS' AS sku, 19 AS stock_quantity
) v
WHERE p.slug = 'haunt-stay-cap'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;

INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'OS' AS size, 'HAUNT-TOTE-OS' AS sku, 15 AS stock_quantity
) v
WHERE p.slug = 'haunt-tote-bag'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;

INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'S' AS size, 'HAUNT-EOL-LS-S' AS sku, 0 AS stock_quantity
  UNION ALL SELECT 'M', 'HAUNT-EOL-LS-M', 0
  UNION ALL SELECT 'L', 'HAUNT-EOL-LS-L', 0
  UNION ALL SELECT 'XL', 'HAUNT-EOL-LS-XL', 0
) v
WHERE p.slug = 'haunt-eyes-of-life-longsleeve'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;

-- 4. Sample orders (fake customers, clearly marked as samples)
INSERT INTO orders (
  order_number, user_id, shipping_address_id, status, currency,
  subtotal, shipping_total, discount_total, grand_total,
  customer_email, placed_at,
  customer_name, customer_phone,
  shipping_address_line_1, shipping_address_line_2,
  shipping_city, shipping_region, shipping_postal_code, shipping_country_code,
  payment_method
)
VALUES (
  'HNT-20261110-0001', NULL, NULL, 'pending', 'MMK',
  84000.00, 0.00, 0.00, 84000.00,
  'sample@haunt-demo.test', '2026-11-10 10:00:00',
  'Sample Customer', '09123456789',
  '123 Sample Street', NULL,
  'Yangon', 'Yangon Region', NULL, 'MM',
  'cash_on_delivery'
)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  subtotal = VALUES(subtotal),
  grand_total = VALUES(grand_total),
  customer_email = VALUES(customer_email);

INSERT INTO orders (
  order_number, user_id, shipping_address_id, status, currency,
  subtotal, shipping_total, discount_total, grand_total,
  customer_email, placed_at,
  customer_name, customer_phone,
  shipping_address_line_1, shipping_address_line_2,
  shipping_city, shipping_region, shipping_postal_code, shipping_country_code,
  payment_method
)
VALUES (
  'HNT-20261110-0002', NULL, NULL, 'completed', 'MMK',
  67000.00, 0.00, 0.00, 67000.00,
  'demo@haunt-demo.test', '2026-11-11 15:30:00',
  'Demo Buyer', '09987654321',
  '45 Demo Road', NULL,
  'Mandalay', 'Mandalay Region', NULL, 'MM',
  'cash_on_delivery'
)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  subtotal = VALUES(subtotal),
  grand_total = VALUES(grand_total),
  customer_email = VALUES(customer_email);

-- 4a. Sample order items (insert only when missing)
INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot, unit_price, quantity, line_total)
SELECT o.id, v.id, 'HΛUNT — VOID TEE', v.sku, v.size, 42000.00, 2, 84000.00
FROM orders o
JOIN product_variants v ON v.sku = 'HAUNT-VOID-TEE-M'
WHERE o.order_number = 'HNT-20261110-0001'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.variant_id = v.id
);

INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot, unit_price, quantity, line_total)
SELECT o.id, v.id, 'HΛUNT — VOID TEE', v.sku, v.size, 42000.00, 1, 42000.00
FROM orders o
JOIN product_variants v ON v.sku = 'HAUNT-VOID-TEE-L'
WHERE o.order_number = 'HNT-20261110-0002'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.variant_id = v.id
);

INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot, unit_price, quantity, line_total)
SELECT o.id, v.id, 'HΛUNT — STAY CAP', v.sku, v.size, 25000.00, 1, 25000.00
FROM orders o
JOIN product_variants v ON v.sku = 'HAUNT-STAY-CAP-OS'
WHERE o.order_number = 'HNT-20261110-0002'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.variant_id = v.id
);

-- 4b. Sample payments (insert only when missing, via the unique provider reference)
INSERT INTO payments (order_id, provider, provider_reference, status, amount, currency, paid_at)
SELECT o.id, 'cash_on_delivery', 'SAMPLE-HNT-20261110-0001-COD', 'pending', 84000.00, 'MMK', NULL
FROM orders o
WHERE o.order_number = 'HNT-20261110-0001'
ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount);

INSERT INTO payments (order_id, provider, provider_reference, status, amount, currency, paid_at)
SELECT o.id, 'cash_on_delivery', 'SAMPLE-HNT-20261110-0002-COD', 'captured', 67000.00, 'MMK', '2026-11-11 15:35:00'
FROM orders o
WHERE o.order_number = 'HNT-20261110-0002'
ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount);
