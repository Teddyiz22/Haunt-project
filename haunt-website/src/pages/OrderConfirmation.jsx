import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { ApiError } from '../services/productService.js'
import { getOrderByNumber } from '../services/orderService.js'
import { formatMmk } from '../utils/formatMoney.js'
import { usePageMeta } from '../utils/seo.js'
import './OrderConfirmation.css'

function formatAddress(order) {
  const address = order.address || {}
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.region].filter(Boolean).join(', '),
    address.postalCode,
    address.countryCode,
  ]
    .filter(Boolean)
    .join(' — ')
}

export default function OrderConfirmation() {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  usePageMeta({
    title: order ? `Order ${order.orderNumber}` : 'Order confirmed',
    description: 'Your HΛUNT order — cash on delivery. The things that stay with you.',
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    if (!email) {
      setLoading(false)
      setError(
        'We need the email address used for this order to show it. Please place the order again or contact the store.',
      )
      return () => {
        cancelled = true
      }
    }
    getOrderByNumber(orderNumber, email)
      .then((payload) => {
        if (!cancelled) setOrder(payload.data)
      })
      .catch((requestError) => {
        if (cancelled) return
        setOrder(null)
        setError(
          requestError instanceof ApiError && requestError.status === 404
            ? 'We could not find that order with the email given.'
            : requestError.message || 'The order could not be loaded.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderNumber, email])

  return (
    <StorefrontLayout>
      <section className="confirmation">
        <div className="container">
          {loading && <p className="muted-text">Loading your order.</p>}

          {!loading && error && (
            <div className="catalog-state confirmation__error">
              <p className="section-label">Order not found</p>
              <h1 className="confirmation__title">{error}</h1>
              <Link className="outline-button button-text" to="/shop">
                Continue shopping
              </Link>
            </div>
          )}

          {!loading && order && (
            <>
              <p className="section-label">Thank you — your order is placed</p>
              <h1 className="confirmation__title">Order {order.orderNumber}</h1>
              <p className="muted-text">
                Status: {order.status} · Payment: Cash on Delivery · The store will
                contact you to confirm delivery.
              </p>

              <div className="confirmation__layout">
                <div className="confirmation__details">
                  <h2 className="section-label">Items</h2>
                  <ul className="confirmation__items">
                    {order.items.map((item) => (
                      <li key={`${item.variantId}-${item.size}`}>
                        <span>
                          {item.productName} — {item.size} × {item.quantity}
                        </span>
                        <span>{formatMmk(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="confirmation__totals">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatMmk(order.subtotal)}</dd>
                    </div>
                    <div>
                      <dt>Delivery</dt>
                      <dd>To be confirmed by the store</dd>
                    </div>
                    <div className="confirmation__grand">
                      <dt>Total</dt>
                      <dd>{formatMmk(order.grandTotal)}</dd>
                    </div>
                  </dl>
                </div>

                <aside className="confirmation__customer">
                  <h2 className="section-label">Deliver to</h2>
                  <p>
                    <strong>{order.customerName}</strong>
                  </p>
                  <p className="muted-text">{order.customerEmail}</p>
                  {order.customerPhone && (
                    <p className="muted-text">{order.customerPhone}</p>
                  )}
                  <p>{formatAddress(order)}</p>
                </aside>
              </div>

              <Link className="outline-button button-text" to="/shop">
                Continue shopping
              </Link>
            </>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
