import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminOrders, updateOrderStatus, getAdminProduct, updateAdminProduct } from '../services/adminService.js'
import { getProducts, ApiError } from '../services/productService.js'
import { formatMmk } from '../utils/formatMoney.js'
import { usePageMeta } from '../utils/seo.js'
import './Admin.css'

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled', 'refunded']

const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ProductStockEditor({ product, token, onSaved }) {
  const [price, setPrice] = useState(String(product.price_mmk))
  const [stocks, setStocks] = useState(() =>
    Object.fromEntries((product.variants || []).map((variant) => [variant.size, String(variant.stock_quantity)])),
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const dirty =
    price !== String(product.price_mmk) ||
    (product.variants || []).some((variant) => stocks[variant.size] !== String(variant.stock_quantity))

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      // The product write endpoint takes the full product body.
      const full = await getAdminProduct(token, product.id)
      const body = full.data
      const payload = {
        name: body.name,
        slug: body.slug,
        sku: body.sku,
        description: body.description || '',
        price_mmk: price,
        category_id: body.category?.id ?? null,
        is_featured: body.is_featured,
        is_active: body.is_active,
        images: (body.images || []).map((image) => ({
          image_url: image.url,
          alt_text: image.alt_text || '',
          sort_order: image.sort_order,
          is_primary: image.is_primary,
        })),
        variants: (body.variants || []).map((variant) => ({
          size: variant.size,
          sku: variant.sku,
          stock_quantity: Number(stocks[variant.size] ?? variant.stock_quantity),
          is_active: variant.is_active,
        })),
      }
      const saved = await updateAdminProduct(token, product.id, payload)
      setMessage(`Saved ${saved.data.name}.`)
      onSaved()
    } catch (requestError) {
      setError(requestError.message || 'The product could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="admin-product">
      <div className="admin-product__head">
        <div>
          <p className="admin-product__name">{product.name}</p>
          <p className="muted-text admin-product__meta">
            {product.slug} · {product.category?.name || 'No category'}
          </p>
        </div>
        <label className="admin-product__price">
          <span>Price (MMK)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>
      </div>
      <div className="admin-product__sizes">
        {(product.variants || []).map((variant) => (
          <label key={variant.id} className="admin-product__size">
            <span>{variant.size}</span>
            <input
              type="number"
              min="0"
              step="1"
              value={stocks[variant.size] ?? String(variant.stock_quantity)}
              onChange={(event) => setStocks((current) => ({ ...current, [variant.size]: event.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="admin-product__foot">
        <button
          type="button"
          className="outline-button button-text"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save price & stock'}
        </button>
        {message && <p className="admin-product__message" role="status">{message}</p>}
        {error && <p className="admin-product__error" role="alert">{error}</p>}
      </div>
    </li>
  )
}

export default function AdminOrders() {
  const { user, token, loading } = useAuth()
  const [tab, setTab] = useState('orders')
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [statusSaving, setStatusSaving] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')

  usePageMeta({
    title: 'Admin — Orders',
    description: 'HΛUNT admin: orders and stock.',
  })

  function loadOrders(page = 1) {
    if (!token) return
    setOrdersLoading(true)
    setOrdersError('')
    getAdminOrders(token, { status: statusFilter, page, limit: 20 })
      .then((payload) => {
        setOrders(payload.data || [])
        setPagination(payload.pagination || { page: 1, total_pages: 1, total: 0 })
      })
      .catch((requestError) => {
        setOrders([])
        setOrdersError(
          requestError instanceof ApiError ? requestError.message : 'Orders could not be loaded.',
        )
      })
      .finally(() => setOrdersLoading(false))
  }

  useEffect(() => {
    if (!loading && user?.role === 'admin' && token) loadOrders(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, token, statusFilter])

  function loadProducts() {
    setProductsLoading(true)
    setProductsError('')
    getProducts({ limit: '48' })
      .then((payload) => setProducts(payload.data || []))
      .catch((requestError) => {
        setProducts([])
        setProductsError(
          requestError instanceof ApiError ? requestError.message : 'Products could not be loaded.',
        )
      })
      .finally(() => setProductsLoading(false))
  }

  useEffect(() => {
    if (tab === 'products' && user?.role === 'admin') loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  if (!loading && !user) return <Navigate to="/login" replace />

  async function handleStatusChange(orderNumber, nextStatus) {
    setStatusSaving(orderNumber)
    setStatusMessage('')
    try {
      await updateOrderStatus(token, orderNumber, nextStatus)
      setOrders((current) =>
        current.map((order) =>
          order.orderNumber === orderNumber ? { ...order, status: nextStatus } : order,
        ),
      )
      setStatusMessage(`${orderNumber} is now ${ORDER_STATUS_LABELS[nextStatus]}.`)
    } catch (requestError) {
      setStatusMessage(requestError.message || 'The status could not be changed.')
    } finally {
      setStatusSaving('')
    }
  }

  return (
    <StorefrontLayout>
      <section className="admin">
        <div className="container">
          <p className="section-label">Admin</p>
          <h1 className="admin__title">Store admin</h1>

          {loading && <p className="muted-text">Loading…</p>}

          {!loading && user?.role !== 'admin' && (
            <div className="catalog-state" role="alert">
              <p className="section-label">Admins only</p>
              <p>This page is for HΛUNT administrators. Sign in with an admin account to continue.</p>
              <Link className="outline-button button-text" to="/account">Back to your account</Link>
            </div>
          )}

          {!loading && user?.role === 'admin' && (
            <>
              <div className="admin__tabs" role="tablist" aria-label="Admin sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'orders'}
                  className={tab === 'orders' ? 'is-active' : ''}
                  onClick={() => setTab('orders')}
                >
                  Orders {pagination.total > 0 && `(${pagination.total})`}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'products'}
                  className={tab === 'products' ? 'is-active' : ''}
                  onClick={() => setTab('products')}
                >
                  Products & stock
                </button>
              </div>

              {tab === 'orders' && (
                <div>
                  <form className="admin__filters" onSubmit={(event) => event.preventDefault()}>
                    <label>
                      <span>Status</span>
                      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="">All</option>
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="outline-button button-text" onClick={() => loadOrders(1)}>
                      Refresh
                    </button>
                  </form>

                  {statusMessage && <p className="admin__message" role="status">{statusMessage}</p>}
                  {ordersLoading && <p className="muted-text">Loading orders…</p>}
                  {!ordersLoading && ordersError && (
                    <p className="admin__error" role="alert">{ordersError}</p>
                  )}
                  {!ordersLoading && !ordersError && orders.length === 0 && (
                    <p className="muted-text">No orders match this filter yet.</p>
                  )}
                  {!ordersLoading && !ordersError && orders.length > 0 && (
                    <ul className="admin__order-list">
                      {orders.map((order) => (
                        <li className="admin__order" key={order.orderNumber}>
                          <div className="admin__order-head">
                            <Link
                              className="admin__order-number"
                              to={`/order/${encodeURIComponent(order.orderNumber)}?email=${encodeURIComponent(order.customerEmail)}`}
                            >
                              {order.orderNumber}
                            </Link>
                            <span className={`order-status order-status--${order.status}`}>
                              {ORDER_STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>
                          <p className="muted-text admin__order-meta">
                            {formatDate(order.placedAt)} · {order.customerName || order.customerEmail}
                            {order.customerPhone ? ` · ${order.customerPhone}` : ''} · {order.customerEmail}
                          </p>
                          <p className="muted-text admin__order-meta">
                            {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                            {order.itemNames ? ` · ${order.itemNames}` : ''} · {formatMmk(order.grandTotal)}
                            {order.paymentMethod === 'cash_on_delivery' ? ' · Cash on delivery' : ''}
                          </p>
                          <label className="admin__status">
                            <span>Change status</span>
                            <select
                              value={order.status}
                              disabled={statusSaving === order.orderNumber}
                              onChange={(event) => handleStatusChange(order.orderNumber, event.target.value)}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                              ))}
                            </select>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!ordersLoading && !ordersError && pagination.total_pages > 1 && (
                    <nav className="shop__pagination" aria-label="Order pages">
                      <button
                        type="button"
                        className="outline-button button-text"
                        disabled={Number(pagination.page) <= 1}
                        onClick={() => loadOrders(Number(pagination.page) - 1)}
                      >
                        Previous
                      </button>
                      <p className="muted-text">{pagination.page} / {pagination.total_pages}</p>
                      <button
                        type="button"
                        className="outline-button button-text"
                        disabled={Number(pagination.page) >= pagination.total_pages}
                        onClick={() => loadOrders(Number(pagination.page) + 1)}
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </div>
              )}

              {tab === 'products' && (
                <div>
                  {productsLoading && <p className="muted-text">Loading products…</p>}
                  {!productsLoading && productsError && (
                    <p className="admin__error" role="alert">{productsError}</p>
                  )}
                  {!productsLoading && !productsError && products.length === 0 && (
                    <p className="muted-text">No live products yet.</p>
                  )}
                  {!productsLoading && !productsError && products.length > 0 && (
                    <ul className="admin__product-list">
                      {products.map((product) => (
                        <ProductStockEditor
                          key={product.id}
                          product={product}
                          token={token}
                          onSaved={loadProducts}
                        />
                      ))}
                    </ul>
                  )}
                  <p className="muted-text admin__hint">
                    Price and stock save through the admin API. Product photos are
                    uploaded separately — the photo shoot list is still open.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
