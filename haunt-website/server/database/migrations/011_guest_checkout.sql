USE haunt_store;

-- Step 11: guest checkout details on orders.
-- Guest checkout has no user account, and addresses.user_id is NOT NULL, so
-- the guest name, phone, and delivery address live on the order itself.
-- Safe to re-run: each column is added only when it is missing.

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'customer_name'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN customer_name VARCHAR(200) NULL AFTER customer_email',
  'SELECT ''orders.customer_name already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'customer_phone'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(40) NULL AFTER customer_name',
  'SELECT ''orders.customer_phone already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_address_line_1'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_address_line_1 VARCHAR(255) NULL AFTER customer_phone',
  'SELECT ''orders.shipping_address_line_1 already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_address_line_2'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_address_line_2 VARCHAR(255) NULL AFTER shipping_address_line_1',
  'SELECT ''orders.shipping_address_line_2 already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_city'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(120) NULL AFTER shipping_address_line_2',
  'SELECT ''orders.shipping_city already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_region'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_region VARCHAR(120) NULL AFTER shipping_city',
  'SELECT ''orders.shipping_region already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_postal_code'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_postal_code VARCHAR(30) NULL AFTER shipping_region',
  'SELECT ''orders.shipping_postal_code already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_country_code'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_country_code CHAR(2) NULL AFTER shipping_postal_code',
  'SELECT ''orders.shipping_country_code already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'payment_method'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN payment_method VARCHAR(80) NULL DEFAULT ''cash_on_delivery'' AFTER shipping_country_code',
  'SELECT ''orders.payment_method already exists'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
