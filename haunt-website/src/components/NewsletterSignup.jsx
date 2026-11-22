import { useState } from 'react'
import { ApiError } from '../services/productService.js'
import { API_BASE_URL } from '../config/api.js'

async function subscribeNewsletter(email, source = 'website') {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    })
  } catch {
    throw new ApiError(0, 'Unable to reach the HΛUNT API.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    const error = new ApiError(response.status, payload.error || 'The signup failed.')
    if (Array.isArray(payload.details)) error.details = payload.details
    throw error
  }
  return payload.data
}

export default function NewsletterSignup({ source = 'website', compact = false }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done | error
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return
    setState('sending')
    setMessage('')
    try {
      const data = await subscribeNewsletter(email.trim(), source)
      setMessage(data.message || 'You are on the list. Welcome to HΛUNT.')
      setState('done')
    } catch (error) {
      setMessage(error.message || 'The signup failed. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="newsletter newsletter--done" role="status">
        <p className="section-label">Newsletter</p>
        <p>{message}</p>
      </div>
    )
  }

  return (
    <form
      className={`newsletter${compact ? ' newsletter--compact' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <p className="section-label">Newsletter</p>
      <h2 className="newsletter__title">Stay with us.</h2>
      <p className="muted-text newsletter__text">
        First word on new drops. No noise, no spam — one email when something stays.
      </p>
      <div className="newsletter__row">
        <label className="newsletter__field">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="Your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
            disabled={state === 'sending'}
          />
        </label>
        <button
          className="outline-button button-text newsletter__submit"
          type="submit"
          disabled={state === 'sending' || !email.trim()}
        >
          {state === 'sending' ? 'Joining…' : 'Join the list'}
        </button>
      </div>
      {state === 'error' && message && (
        <p className="newsletter__error" role="alert">{message}</p>
      )}
    </form>
  )
}
