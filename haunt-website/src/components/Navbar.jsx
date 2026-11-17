import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, ShoppingBag, User, X } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collection', to: '/#collection' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

export default function Navbar({ overlay = true }) {
  const { itemCount } = useCart()
  const { user, isSignedIn, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/')
  }

  return (
    <header className={`site-header${overlay ? '' : ' site-header--solid'}`}>
      <div className="site-header__inner container">
        <Link
          className="brand-mark"
          to="/"
          aria-label="HΛUNT home"
          onClick={closeMenu}
        >
          HΛUNT
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link className="nav-text desktop-nav__link" key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          {isSignedIn ? (
            <>
              <Link className="bag-display nav-text" to="/account" aria-label="Your account">
                <User aria-hidden="true" size={16} strokeWidth={1.5} />
                <span>Account</span>
              </Link>
              <button
                className="bag-display nav-text"
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <LogOut aria-hidden="true" size={16} strokeWidth={1.5} />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <Link className="bag-display nav-text" to="/login" aria-label="Sign in">
              <User aria-hidden="true" size={16} strokeWidth={1.5} />
              <span>Login</span>
            </Link>
          )}

          <Link className="bag-display nav-text" to="/bag" aria-label={`Bag, ${itemCount} item${itemCount === 1 ? '' : 's'}`}>
            <ShoppingBag aria-hidden="true" size={16} strokeWidth={1.5} />
            <span>Bag</span>
            {itemCount > 0 && (
              <span className="bag-display__count" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav
        className={`mobile-nav${menuOpen ? ' mobile-nav--open' : ''}`}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {navigation.map((item, index) => (
          <Link
            className="mobile-nav__link"
            key={item.label}
            to={item.to}
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="mobile-nav__number">0{index + 1}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <Link
          className="mobile-nav__link"
          to={isSignedIn ? '/account' : '/login'}
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
        >
          <span className="mobile-nav__number">0{navigation.length + 1}</span>
          <span>{isSignedIn ? `Account (${user?.first_name || 'You'})` : 'Login'}</span>
        </Link>
        {isSignedIn && (
          <button
            className="mobile-nav__link"
            type="button"
            onClick={handleLogout}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="mobile-nav__number">0{navigation.length + 2}</span>
            <span>Sign out</span>
          </button>
        )}
      </nav>
    </header>
  )
}
