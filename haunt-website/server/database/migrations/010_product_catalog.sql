USE haunt_store;

-- Step 10: featured product flag for catalog filtering.
-- Safe to re-run: adds the column only when it is missing.

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'is_featured'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER price_mmk, ADD KEY idx_products_featured_active (is_featured, is_active)',
  'SELECT ''products.is_featured already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
