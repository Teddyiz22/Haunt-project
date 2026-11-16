import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collection', to: '/#collection' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

export default function Navbar({ overlay = true }) {
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
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
      </nav>
    </header>
  )
}
