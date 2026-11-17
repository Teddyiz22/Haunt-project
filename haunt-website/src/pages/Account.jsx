import { Link, Navigate, useNavigate } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Account.css'

export default function Account() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

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
                  You are signed in as an administrator. Product changes are made
                  through the admin API — an admin screen in the store is a later step.
                </p>
              )}

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
