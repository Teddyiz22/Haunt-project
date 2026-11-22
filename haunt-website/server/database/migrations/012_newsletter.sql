USE haunt_store;

-- Newsletter subscribers. No email is ever sent from this table in v1;
-- it only records addresses that asked to hear about drops.
-- Safe to re-run: the table is created only when it is missing.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'website',
  subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_email (email),
  KEY idx_newsletter_subscribed_at (subscribed_at)
) ENGINE=InnoDB;
