# HΛUNT — Testing Notes (modern storefront, 2026-11-22)

## Ports

- Website: http://localhost:5173
- API: http://localhost:4000

## What was verified in this VM (no MySQL here)

- `npm run build` passes (frontend, from `haunt-website/`).
- `node --check` passes on every new/changed server file.
- API started with **no `.env` and no database**:
  - `GET /` → 200
  - `GET /api/health` → **503, `status: "degraded"`, `database: "disconnected"`**
    (honest — it never reports `ok` without a database).
  - `POST /api/auth/register` and `POST /api/auth/login` with `{}` → **400**
    with field-level `details`.
  - `GET /api/orders/mine` with no token → **503** (JWT_SECRET not configured —
    fail-closed, not a silent pass).
  - `GET /api/admin/orders` and `PATCH /api/admin/orders/.../status` with no
    token → **401**.
  - `POST /api/newsletter` with a bad email → **400**; with a valid email and
    no database → **503 "Database is unavailable"** (no fake success).
  - `GET /api/products` with no database → **503**.
- API started with `JWT_SECRET` set (still no database):
  - `GET /api/orders/mine` with no token or a fake token → **401**.
  - `POST /api/auth/login` with a well-formed body → **503 "Database is
    unavailable"**.
- Frontend preview (`npm run preview -- --port 4173`): every main route
  returns **200**: `/`, `/shop`, `/product/haunt-eyes-of-life-tee`, `/bag`,
  `/checkout`, `/order/HNT-20261110-0001`, `/login`, `/register`, `/account`,
  `/about`, `/collection`, `/contact`, `/admin/orders`.
- The built bundle contains the new auth-error copy ("Unable to reach the
  HΛUNT API.", "This is a problem with the store, not your account") and the
  newsletter/admin code.

## What still needs Htet's machine (MySQL 8)

From the repo root, in order:

```sh
# 1. Database (one time)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS haunt_store CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -u root -p < haunt-website/server/database/schema.sql
mysql -u root -p < haunt-website/server/database/migrations/010_product_catalog.sql
mysql -u root -p < haunt-website/server/database/migrations/011_guest_checkout.sql
mysql -u root -p < haunt-website/server/database/migrations/012_newsletter.sql
mysql -u root -p < haunt-website/server/database/seeds/010_demo_catalog.sql
mysql -u root -p < haunt-website/server/database/seeds/011_sample_dataset.sql

# 2. Secrets — server/.env must have DB_PASSWORD and a long JWT_SECRET
#    (at least 32 random characters). Without JWT_SECRET, login and
#    registration return 503 and the pages now say so instead of failing
#    silently. Restart the API after any .env change.

# 3. First admin account (from haunt-website/server/)
npm run create-admin -- --email admin@example.com --password 'a-long-secret'

# 4. Run both apps (one terminal)
cd haunt-website && npm run dev:all
# Website http://localhost:5173 — API http://localhost:4000
```

### Checks to run there

1. **Health**: `curl http://localhost:4000/api/health` → 200,
   `status: "ok"`, `database: "connected"`.
2. **Catalog**: open `/shop` — Eyes of Life Tee (45,000 MMK) and Void Hoodie
   (85,000 MMK) list; search, category, size, sort and the wishlist filter
   all work. Products without photos show the branded HΛUNT placeholder tile,
   never an empty box.
3. **Newsletter**: submit an email in the home or footer form → success
   message; submit the same email again → "You're already on the list".
   Check the row landed in `newsletter_subscribers`:
   `mysql -u root -p -e "SELECT email, source, subscribed_at FROM haunt_store.newsletter_subscribers;"`
4. **Order history**: register an account, then place a guest order with the
   **same email** as the account — checkout now prefills name/email when
   signed in. Open `/account` → the order appears in "Your orders".
5. **Admin**: sign in as the admin account → navbar shows Admin; open
   `/admin/orders` → both sample orders list; change one status (e.g. pending
   → confirmed) → it saves and the order's status pill updates. Products &
   stock tab: change a price or a size stock, Save → reload `/shop` and see
   the new price/stock.
6. **Auth errors (in the running page, not just curl)**:
   - Wrong password → "Email or password is incorrect." and nothing else
     (the page must never hint whether the email exists).
   - Stop the API, then sign in → "Unable to reach the HΛUNT API." plus the
     hint "Check that the API is running on port 4000, then try again."
   - Remove `JWT_SECRET` from `server/.env` and restart the API, then sign
     in → the page shows the real 503 message with the hint "This is a
     problem with the store, not your account."
   - Register with an email that already has an account → the page shows the
     API's duplicate-account message (409).
7. **End-to-end order test** (still unreported): follow the checklist in
   `workspace/goals/haunt-store-cart-and-checkout/files/haunt-order-test-checklist.md`
   — Eyes of Life Tee size M × 1 only, expect M stock 15 → 14 and total
   45,000 MMK. If Tee M stock is already 14, **do not place a second test
   order**.

## Demo accounts

There are **no demo customer accounts** in the seeds. Sample orders exist for
`sample@haunt-demo.test` / `demo@haunt-demo.test`, but those are order emails,
not login accounts. Register a fresh account to test order history, and use
`npm run create-admin` for the admin account.

## Still not verified (needs real photos)

Product photos are placeholders: seed 010 references
`eyes-of-life-01.jpg`, `eyes-of-life-02.jpg`, `void-hoodie-01.jpg` in
`server/uploads/products/` and the hero/collection images are Pexels
placeholders. The 6-shot list is at
`workspace/goals/haunt-store-cart-and-checkout/files/haunt-drop01-photo-shot-list.md`.
Until the real photos arrive, missing photos render as the branded
placeholder tile — check that no page shows a broken image icon.

## Known limits of this pass

- Wishlist filtering applies to the products loaded on the current shop page
  (page size 12); the live catalog is small enough that this covers it.
- Admin product editing changes price and per-size stock only — it does not
  upload product images (that endpoint exists at the API level; the admin UI
  for it is a next step).
- No automated tests exist yet (zero tests in the repo, before and after).
- Newsletter stores emails only; nothing sends email from this table.
