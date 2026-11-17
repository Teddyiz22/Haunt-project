import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Register.css'

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [details, setDetails] = useState([])
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/account" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setDetails([])
    setSubmitting(true)
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      })
      navigate('/account')
    } catch (requestError) {
      setError(requestError.message || 'Registration failed.')
      setDetails(Array.isArray(requestError.details) ? requestError.details : [])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StorefrontLayout>
      <section className="auth">
        <div className="container auth__inner">
          <p className="section-label">Your account</p>
          <h1 className="auth__title">Create account</h1>
          <p className="muted-text auth__intro">
            One account for the HΛUNT store. Your password must be at least 8 characters.
            Guest checkout still works without an account.
          </p>

          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="auth__row">
              <label className="auth__field">
                <span>First name</span>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  maxLength={100}
                />
              </label>

              <label className="auth__field">
                <span>Last name</span>
                <input
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  maxLength={100}
                />
              </label>
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>

            {error && (
              <p className="auth__error" role="alert">
                {error}
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
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="muted-text auth__switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </StorefrontLayout>
  )
}
