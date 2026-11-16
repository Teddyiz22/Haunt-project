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

Database credentials and JWT settings come from environment variables. The API uses a bounded JSON body parser, explicit CORS origins, a centralized error handler, and a generic validation middleware. SQL access is designed to use the mysql2 parameterized query interface. `bcrypt` and `jsonwebtoken` are dependencies for later authentication work; no authentication endpoints or token issuance are implemented in this step. `authorizeRoles` is a preparation middleware for use after a future authentication middleware sets `req.user`; it does not itself authenticate requests.

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
