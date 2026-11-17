# HΛUNT Store Foundation

The current React/Vite storefront remains at the project root. The Express API and MySQL foundation live in `server/`; this keeps existing frontend paths and components intact.

## Project structure

```text
haunt-website/
├── src/                         # Existing React/Vite frontend
│   └── config/api.js             # Configurable API base URL
├── public/
├── server/
│   ├── database/schema.sql       # MySQL schema for haunt_store
│   ├── src/
│   │   ├── config/database.js    # MySQL connection pool
│   │   ├── controllers/          # Health controller
│   │   ├── middleware/           # Error, not-found, validation, role checks
│   │   ├── models/               # Database health check
│   │   ├── routes/               # REST routes
│   │   ├── services/             # Health service
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .env.example                  # Frontend API URL
└── README.md
```

## Requirements

- Node.js 20 or newer
- MySQL 8.0 or newer (the schema uses the `utf8mb4_0900_ai_ci` collation)

## Install

From the project root:

```sh
npm install
cp .env.example .env
cd server
npm install
cp .env.example .env
```

Replace the example values in both `.env` files as appropriate. Never commit either `.env` file. `JWT_SECRET` is included for the later authentication step and must be a long, random secret before JWT authentication is implemented.

## Create the database

Create a dedicated MySQL application account with access only to this database. For local development, connect to MySQL as an administrator and run (replace the example password):

```sql
CREATE DATABASE IF NOT EXISTS haunt_store
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'haunt_app'@'localhost' IDENTIFIED BY 'replace_with_a_local_secret';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON haunt_store.* TO 'haunt_app'@'localhost';
FLUSH PRIVILEGES;
```

Then load the schema as a database administrator (the application account is intentionally limited to the already-created database):

```sh
mysql -u root -p < server/database/schema.sql
```

The schema creates/selects `haunt_store`. Update `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `server/.env` to match the database connection. The schema creates normalized users, addresses, categories, products, images, size variants/inventory, carts, orders, order items, and payments tables. It does not insert customer or product data.

## Start the applications

Use separate terminals from the project root:

```sh
npm run dev
```

```sh
cd server
npm run dev
```

The Vite frontend defaults to `http://localhost:5173`; the API defaults to `http://localhost:4000`. Set `VITE_API_BASE_URL` in the root `.env` to change the frontend API base URL. Set `CLIENT_ORIGIN` in `server/.env` to the permitted frontend origin (comma-separated origins are supported).

## Health check

```sh
curl -i http://localhost:4000/api/health
```

With MySQL connected, expect HTTP 200 with `success: true`, `status: "ok"`, and `database: "connected"`. If the API is running but MySQL is unavailable or misconfigured, the endpoint returns HTTP 503 with `status: "degraded"` and `database: "disconnected"`; it does not disclose credentials or raw database errors.

## Security foundation

Database credentials and JWT settings come from environment variables. The API uses a bounded JSON body parser, explicit CORS origins, a centralized error handler, and a generic validation middleware. SQL access is designed to use the mysql2 parameterized query interface. `bcrypt` and `jsonwebtoken` power Step 11 authentication (register/login/JWT); `authorizeRoles` is a preparation middleware for use after the authentication middleware sets `req.user`. See "Login and authentication (Step 11)" below.

`src/config/api.js` exports `API_BASE_URL` for frontend catalog requests. Shop (`/shop`) and product details (`/product/:slug`) load live data from the Express API.

## Product catalog (Step 10)

Apply the featured-product migration, then load demonstration catalog rows (not live inventory):

```sh
mysql -u root -p < server/database/migrations/010_product_catalog.sql
mysql -u root -p < server/database/seeds/010_demo_catalog.sql
```

Demonstration images live in `server/uploads/products/` and are served at `/uploads/products/...`.

### Public API

- `GET /api/products` — active products. Query: `page`, `limit` (max 48), `search`, `category` (slug), `size`, `minPrice`, `maxPrice`, `sort=newest|price_asc|price_desc`, `featured=true|false`
- `GET /api/products/:slug` — full product, images, sizes, and stock
- `GET /api/categories` — active categories

### Admin API (fail-closed)

Write routes require `request.user.role === 'admin'` (Step 11) or `X-Admin-Token` / `Authorization: Bearer` matching `ADMIN_API_TOKEN`. If that environment variable is empty, all writes return 401.

- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id` — deactivates. Add `?hard=true` only when the product is not referenced by carts or orders
- `POST /api/admin/products/:id/images` — multipart field `images` (JPEG/PNG/WebP, 5MB, max 8)
- `DELETE /api/admin/products/:id/images/:imageId`

Do not store image binaries in MySQL. For production, keep the same URL field and move files to object storage (for example S3 or R2), then store the object URL in `product_images.image_url`.

## Login and authentication (Step 11)

Customers can create an account and sign in; signing in is optional — guest
checkout keeps working with no account.

### Setup

Set a long random secret in `server/.env` before anyone can sign in:

```sh
JWT_SECRET=<a long random secret, at least 32 characters>
```

Authentication is unavailable until `JWT_SECRET` is set to a real secret (the
placeholder from `.env.example` does not count): login and registration
return 503 and `/api/auth/me` returns 503. Tokens last `JWT_EXPIRES_IN`
(default `1h`).

Create the first administrator account (from `server/`):

```sh
npm run create-admin -- --email admin@example.com --password 'a-long-secret'
# or: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='a-long-secret' npm run create-admin
```

The script hashes the password and inserts a user with role `admin`. It is
safe to re-run: if the email already has an account, it prints a message and
exits without changing the password.

### Auth API

- `POST /api/auth/register` — body `{ first_name, last_name, email, password }`
  (password 8–128 characters). Returns 201 with `{ user, token }`. A duplicate
  email returns 409. New accounts are always role `customer`.
- `POST /api/auth/login` — body `{ email, password }`. Returns 200 with
  `{ user, token }`. Wrong credentials return a generic 401 that never
  reveals whether the email is registered.
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`. Returns
  `{ user }`. Missing, invalid, or expired tokens, and inactive or deleted
  users, all return 401. The user object never contains `password_hash`.

Passwords are stored as bcrypt hashes (cost 12) and are never returned or
logged. There is no password-reset flow yet — that is a later step.

### Admin access

Admin product routes accept two ways in, in this order:

1. A signed-in admin account: send the login token as
   `Authorization: Bearer <token>` (an admin JWT sets `request.user`).
2. The existing `ADMIN_API_TOKEN` fallback: `X-Admin-Token` or
   `Authorization: Bearer <token>` matching the configured token.

Both are fail-closed: with neither a valid admin JWT nor the configured
token, admin writes return 401. Logout is client-side — the browser deletes
the stored token (`localStorage` key `haunt-auth-token`) because JWTs are
stateless.

### Frontend

Routes: `/login`, `/register`, `/account` (redirects to `/login` when signed
out). `src/context/AuthContext.jsx` keeps the token and user, restores the
session on load by calling `/api/auth/me`, and clears a rejected token. The
navbar shows Login when signed out and Account + Sign out when signed in.

## Cart and guest checkout (Step 12)

The bag is local to the browser: `src/context/CartContext.jsx` keeps items
keyed by variant, merges the same size, caps quantities at stock, and persists
to `localStorage` under `haunt-cart-v1`. Adding from a product page still goes
through `src/services/cartIntegration.js`, which dispatches the
`haunt:add-to-bag` event the provider listens for. Routes: `/bag` (cart),
`/checkout`, `/order/:orderNumber` (confirmation).

Apply the guest-checkout migration before placing orders:

```sh
mysql -u root -p < server/database/migrations/011_guest_checkout.sql
```

It adds nullable guest columns to `orders` — `customer_name`,
`customer_phone`, `shipping_address_line_1`, `shipping_address_line_2`,
`shipping_city`, `shipping_region`, `shipping_postal_code`,
`shipping_country_code`, and `payment_method`. Guest addresses are not stored
in `addresses` because that table requires a `user_id`. The migration is safe
to re-run: each column is added only when it is missing.

Checkout is guest-only — no login is required. Payment is **Cash on Delivery
only**; no payment provider is integrated. Delivery is **0 MMK at checkout,
labelled "to be confirmed by the store"** — no delivery rate is invented; the
store confirms the charge with the customer after the order is placed.

### Order API

- `POST /api/orders` — guest checkout. Body: `{ customer: { name, email,
  phone, addressLine1, addressLine2?, city, region?, postalCode?,
  countryCode }, items: [{ variantId, quantity }] }`. In one transaction the
  API locks each variant row, rejects missing, inactive, or out-of-stock
  items with 400, prices everything from the database (client prices are
  never trusted), inserts the order (`status: 'pending'`, `grand_total =
  subtotal`), snapshots each `order_items` row, decrements
  `product_variants.stock_quantity`, and inserts a `payments` row
  (`provider: 'cash_on_delivery'`, `status: 'pending'`). Returns 201 with
  `{ orderNumber, status, subtotal, shippingTotal, discountTotal, grandTotal,
  customerEmail, items }`. Order numbers look like `HNT-20261116-1234`.
- `GET /api/orders/:orderNumber?email=...` — returns the order and its items
  only when the `email` query matches the order's `customer_email`
  (case-insensitive). Any other result is 404, so the endpoint never reveals
  whether an order number exists.

## Sample dataset (demo only)

Load extra sample data for testing — more products, sizes, and two sample
orders (one pending, one completed) with items and payments:

```sh
mysql -u root -p < server/database/seeds/011_sample_dataset.sql
```

It adds the Accessories category and 5 sample products (Void Tee 42,000 MMK,
Eyes of Life Hoodie 95,000 MMK, Stay Cap 25,000 MMK, Haunt Tote Bag
18,000 MMK, and a sold-out Eyes of Life Longsleeve to test the sold-through
state), plus sample orders `HNT-20261110-0001` (pending, 84,000 MMK) and
`HNT-20261110-0002` (completed, 67,000 MMK) for
`sample@haunt-demo.test` / `demo@haunt-demo.test`. The file is safe to re-run.
Sample orders buy only the new sample products, so the 010 demo stock (Eyes
of Life Tee M = 15) is left untouched for the end-to-end order test. No
product images are included — sample product photos are still an open task.
