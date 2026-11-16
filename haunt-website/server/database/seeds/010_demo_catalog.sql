USE haunt_store;

-- Demonstration catalog only. These rows are not live inventory.
-- Re-running is idempotent via unique slugs/SKUs.

INSERT INTO categories (name, slug, description, is_active)
VALUES
  ('Tees', 'tees', 'Graphic and essential tees.', TRUE),
  ('Outerwear', 'outerwear', 'Jackets and layered pieces.', TRUE)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO products (
  category_id, name, slug, description, sku, price_mmk, is_featured, is_active
)
SELECT c.id,
  'HΛUNT — EYES OF LIFE TEE',
  'haunt-eyes-of-life-tee',
  'Drop 01. Oversized tee cut for presence. The more you see, the less you know. Demonstration listing — not live stock.',
  'HAUNT-EOL-TEE',
  45000.00,
  TRUE,
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
  'HΛUNT — VOID HOODIE',
  'haunt-void-hoodie',
  'Heavyweight hoodie in black. Quiet volume, no excess. Demonstration listing — not live stock.',
  'HAUNT-VOID-HOOD',
  85000.00,
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
  'HΛUNT — ARCHIVE TEE',
  'haunt-archive-tee',
  'Inactive demonstration product used to confirm the public catalog hides unpublished pieces.',
  'HAUNT-ARCH-TEE',
  32000.00,
  FALSE,
  FALSE
FROM categories c
WHERE c.slug = 'tees'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT p.id, '/uploads/products/eyes-of-life-01.jpg', 'HΛUNT Eyes of Life tee — front reference', 0, TRUE
FROM products p WHERE p.slug = 'haunt-eyes-of-life-tee'
AND NOT EXISTS (
  SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.image_url = '/uploads/products/eyes-of-life-01.jpg'
);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT p.id, '/uploads/products/eyes-of-life-02.jpg', 'HΛUNT Eyes of Life tee — back reference', 1, FALSE
FROM products p WHERE p.slug = 'haunt-eyes-of-life-tee'
AND NOT EXISTS (
  SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.image_url = '/uploads/products/eyes-of-life-02.jpg'
);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT p.id, '/uploads/products/void-hoodie-01.jpg', 'HΛUNT Void hoodie — campaign reference', 0, TRUE
FROM products p WHERE p.slug = 'haunt-void-hoodie'
AND NOT EXISTS (
  SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.image_url = '/uploads/products/void-hoodie-01.jpg'
);

INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'S' AS size, 'HAUNT-EOL-TEE-S' AS sku, 10 AS stock_quantity
  UNION ALL SELECT 'M', 'HAUNT-EOL-TEE-M', 15
  UNION ALL SELECT 'L', 'HAUNT-EOL-TEE-L', 20
  UNION ALL SELECT 'XL', 'HAUNT-EOL-TEE-XL', 10
) v
WHERE p.slug = 'haunt-eyes-of-life-tee'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;

INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
SELECT p.id, v.size, v.sku, v.stock_quantity, TRUE
FROM products p
JOIN (
  SELECT 'S' AS size, 'HAUNT-VOID-HOOD-S' AS sku, 4 AS stock_quantity
  UNION ALL SELECT 'M', 'HAUNT-VOID-HOOD-M', 8
  UNION ALL SELECT 'L', 'HAUNT-VOID-HOOD-L', 0
  UNION ALL SELECT 'XL', 'HAUNT-VOID-HOOD-XL', 3
) v
WHERE p.slug = 'haunt-void-hoodie'
ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), is_active = TRUE;
