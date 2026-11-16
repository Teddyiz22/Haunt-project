import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useCart } from '../context/CartContext.jsx'
import { ApiError } from '../services/productService.js'
import { createOrder } from '../services/orderService.js'
import { formatMmk } from '../utils/formatMoney.js'
import './Checkout.css'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  countryCode: 'MM',
}

const FIELDS = [
  { key: 'name', label: 'Full name', autoComplete: 'name', required: true },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', required: true },
  { key: 'addressLine1', label: 'Address line 1', autoComplete: 'address-line1', required: true },
  { key: 'addressLine2', label: 'Address line 2', autoComplete: 'address-line2' },
  { key: 'city', label: 'City', autoComplete: 'address-level2', required: true },
  { key: 'region', label: 'Region / state', autoComplete: 'address-level1' },
  { key: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { key: 'countryCode', label: 'Country code', autoComplete: 'country' },
]

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  function validateLocal() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Full name is required.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
    if (!form.phone.trim()) errors.phone = 'Phone is required.'
    if (!form.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required.'
    if (!form.city.trim()) errors.city = 'City is required.'
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validateLocal()
    setFieldErrors(errors)
    setSubmitError('')
    if (Object.keys(errors).length) return

    setSubmitting(true)
    try {
      const payload = await createOrder({
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          region: form.region.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          countryCode: form.countryCode.trim().toUpperCase() || 'MM',
        },
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      })
      const orderNumber = payload.data?.orderNumber
      const email = form.email.trim()
      clearCart()
      navigate(`/order/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`)
    } catch (requestError) {
      if (requestError instanceof ApiError && Array.isArray(requestError.details)) {
        setSubmitError(requestError.details.join(' '))
      } else if (
        requestError instanceof ApiError &&
        /stock|unavailable|inactive/i.test(requestError.message)
      ) {
        setSubmitError(
          `${requestError.message} Please review your bag — quantities may have changed.`,
        )
      } else {
        setSubmitError(
          requestError.message || 'The order could not be placed. Please try again.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StorefrontLayout>
      <section className="checkout">
        <div className="container">
          <p className="section-label">Checkout</p>
          <h1 className="checkout__title">Checkout</h1>

          {items.length === 0 ? (
            <div className="catalog-state checkout__empty">
              <p className="muted-text">Your bag is empty, so there is nothing to check out.</p>
              <Link className="outline-button button-text" to="/shop">
                Browse the collection
              </Link>
            </div>
          ) : (
            <form className="checkout__layout" onSubmit={handleSubmit} noValidate>
              <div className="checkout__form">
                <h2 className="section-label">Your details</h2>
                <p className="muted-text checkout__intro">
                  Guest checkout — no account needed. We only use these details to
                  deliver your order.
                </p>

                <div className="checkout__fields">
                  {FIELDS.map((field) => (
                    <label className="checkout__field" key={field.key}>
                      <span>
                        {field.label}
                        {field.required ? ' *' : ''}
                      </span>
                      <input
                        type={field.type || 'text'}
                        name={field.key}
                        value={form[field.key]}
                        autoComplete={field.autoComplete}
                        required={field.required}
                        onChange={handleChange}
                        aria-invalid={Boolean(fieldErrors[field.key])}
                        aria-describedby={
                          fieldErrors[field.key] ? `${field.key}-error` : undefined
                        }
                      />
                      {fieldErrors[field.key] && (
                        <span className="checkout__error" id={`${field.key}-error`} role="alert">
                          {fieldErrors[field.key]}
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                <h2 className="section-label checkout__payment-title">Payment</h2>
                <div className="checkout__payment">
                  <label className="checkout__payment-option">
                    <input type="radio" name="payment" checked readOnly />
                    <span>
                      <strong>Cash on Delivery</strong>
                      <span className="muted-text">
                        Pay in cash when your order arrives. This is the only payment
                        method available.
                      </span>
                    </span>
                  </label>
                </div>

                {submitError && (
                  <p className="checkout__error checkout__submit-error" role="alert">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  className="outline-button button-text checkout__submit"
                  disabled={submitting}
                >
                  {submitting ? 'Placing your order…' : 'Place order — Cash on Delivery'}
                </button>
              </div>

              <aside className="checkout__summary">
                <h2 className="section-label">Order summary</h2>
                <ul className="checkout__items">
                  {items.map((item) => (
                    <li key={item.variantId}>
                      <span>
                        {item.name} — {item.size} × {item.quantity}
                      </span>
                      <span>{formatMmk(item.unitPriceMmk * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="checkout__totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatMmk(subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>To be confirmed by the store</dd>
                  </div>
                  <div className="checkout__grand">
                    <dt>Total</dt>
                    <dd>{formatMmk(subtotal)}</dd>
                  </div>
                </dl>
                <p className="muted-text checkout__note">
                  Delivery is 0 MMK here — the store confirms the delivery charge
                  with you after you place the order.
                </p>
                <Link className="checkout__back" to="/bag">
                  Back to the bag
                </Link>
              </aside>
            </form>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
