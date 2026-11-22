import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyOrders } from '../services/orderService.js'
import { ApiError } from '../services/productService.js'
import { formatMmk } from '../utils/formatMoney.js'
import { usePageMeta } from '../utils/seo.js'
import './Account.css'

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

export default function Account() {
  const { user, token, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  usePageMeta({
    title: 'Your account',
    description: 'Your HΛUNT account — orders and details.',
  })

  useEffect(() => {
    if (!user || !token) return undefined
    let cancelled = false
    setOrdersLoading(true)
    setOrdersError('')
    getMyOrders(token)
      .then((payload) => {
        if (!cancelled) setOrders(payload.data || [])
      })
      .catch((requestError) => {
        if (cancelled) return
        setOrders([])
        setOrdersError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Your orders could not be loaded.',
        )
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, token])

  if (!loading && !user) return <Navigate to="/login" replace />

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <StorefrontLayout>
      <section className="account">
        <div className="container">
          <p className="section-label">Your account</p>
          <h1 className="account__title">
            {loading ? 'Account' : `${user?.first_name} ${user?.last_name}`}
          </h1>

          {loading ? (
            <p className="muted-text">Loading your account…</p>
          ) : (
            <>
              <dl className="account__details">
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{user.role === 'admin' ? 'Admin' : 'Customer'}</dd>
                </div>
              </dl>

              {user.role === 'admin' && (
                <p className="account__admin-note">
                  You are signed in as an administrator.{' '}
                  <Link to="/admin/orders">Open the admin orders page</Link> to
                  see every order and change its status.
                </p>
              )}

              <section className="account__orders" aria-labelledby="orders-title">
                <h2 className="account__section-title" id="orders-title">Your orders</h2>
                {ordersLoading && <p className="muted-text">Loading your orders…</p>}
                {!ordersLoading && ordersError && (
                  <p className="account__error" role="alert">{ordersError}</p>
                )}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <p className="muted-text">
                    No orders yet. Orders placed with this email will appear here.
                  </p>
                )}
                {!ordersLoading && !ordersError && orders.length > 0 && (
                  <ul className="account__order-list">
                    {orders.map((order) => (
                      <li className="account__order" key={order.orderNumber}>
                        <div className="account__order-head">
                          <Link
                            className="account__order-number"
                            to={`/order/${encodeURIComponent(order.orderNumber)}?email=${encodeURIComponent(user.email)}`}
                          >
                            {order.orderNumber}
                          </Link>
                          <span className={`order-status order-status--${order.status}`}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <p className="muted-text account__order-meta">
                          {formatDate(order.placedAt)} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                          {order.itemNames ? ` · ${order.itemNames}` : ''}
                        </p>
                        <p className="account__order-total">{formatMmk(order.grandTotal)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <p className="muted-text account__note">
                Guest checkout still works without an account — signing in is optional.
              </p>

              <div className="account__actions">
                <Link className="outline-button button-text" to="/shop">
                  Continue shopping
                </Link>
                <button
                  className="outline-button button-text"
                  type="button"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
