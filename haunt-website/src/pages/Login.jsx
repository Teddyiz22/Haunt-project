import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { describeAuthError } from '../services/authService.js'
import { usePageMeta } from '../utils/seo.js'
import './Login.css'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const [details, setDetails] = useState([])
  const [submitting, setSubmitting] = useState(false)

  usePageMeta({
    title: 'Sign in',
    description: 'Sign in to your HΛUNT account to see your orders.',
  })

  if (!loading && user) return <Navigate to="/account" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setHint('')
    setDetails([])
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate('/account')
    } catch (requestError) {
      const described = describeAuthError(requestError)
      setError(described.message)
      setHint(described.hint)
      setDetails(described.details)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StorefrontLayout>
      <section className="auth">
        <div className="container auth__inner">
          <p className="section-label">Your account</p>
          <h1 className="auth__title">Sign in</h1>
          <p className="muted-text auth__intro">
            Sign in to your HΛUNT account. Guest checkout still works without an account.
          </p>

          <form className="auth__form" onSubmit={handleSubmit}>
            <label className="auth__field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
              />
            </label>

            <label className="auth__field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && (
              <p className="auth__error" role="alert">
                {error}
                {hint && <span className="auth__error-hint">{hint}</span>}
                {details.length > 0 && (
                  <span className="auth__error-details">
                    {details.map((detail) => (
                      <span key={detail}>{detail}</span>
                    ))}
                  </span>
                )}
              </p>
            )}

            <button className="outline-button button-text auth__submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="muted-text auth__switch">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </StorefrontLayout>
  )
}
