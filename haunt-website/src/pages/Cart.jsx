import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatMmk } from '../utils/formatMoney.js'
import { resolveMediaUrl } from '../utils/mediaUrl.js'
import './Cart.css'

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart()

  return (
    <StorefrontLayout>
      <section className="bag">
        <div className="container">
          <p className="section-label">Your bag</p>
          <h1 className="bag__title">
            Bag {itemCount > 0 && <span>({itemCount})</span>}
          </h1>

          {items.length === 0 ? (
            <div className="catalog-state bag__empty">
              <p className="muted-text">Your bag is empty.</p>
              <Link className="outline-button button-text" to="/shop">
                Browse the collection
              </Link>
            </div>
          ) : (
            <div className="bag__layout">
              <ul className="bag__items">
                {items.map((item) => (
                  <li className="bag-item" key={item.variantId}>
                    <Link className="bag-item__media" to={`/product/${item.slug}`}>
                      {item.imageUrl ? (
                        <img src={resolveMediaUrl(item.imageUrl)} alt={item.name} />
                      ) : (
                        <div className="product-card__placeholder" aria-hidden="true" />
                      )}
                    </Link>
                    <div className="bag-item__info">
                      <h2 className="bag-item__name">
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </h2>
                      <p className="muted-text bag-item__meta">Size {item.size}</p>
                      <p className="bag-item__price">{formatMmk(item.unitPriceMmk)}</p>
                      <div className="bag-item__controls">
                        <div className="bag-item__qty">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus aria-hidden="true" size={14} />
                          </button>
                          <span aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            disabled={
                              Number.isFinite(item.stockQuantity) &&
                              item.quantity >= item.stockQuantity
                            }
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus aria-hidden="true" size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="bag-item__remove"
                          aria-label={`Remove ${item.name} from the bag`}
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 aria-hidden="true" size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                      {Number.isFinite(item.stockQuantity) && (
                        <p className="muted-text bag-item__stock">
                          {item.stockQuantity} available in {item.size}
                        </p>
                      )}
                    </div>
                    <p className="bag-item__total">
                      {formatMmk(item.unitPriceMmk * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <aside className="bag__summary">
                <h2 className="section-label">Summary</h2>
                <dl className="bag__totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatMmk(subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>To be confirmed by the store</dd>
                  </div>
                  <div className="bag__grand">
                    <dt>Total</dt>
                    <dd>{formatMmk(subtotal)}</dd>
                  </div>
                </dl>
                <p className="muted-text bag__note">
                  Payment is cash on delivery. Delivery is confirmed by the store
                  after you place the order.
                </p>
                <Link className="outline-button button-text bag__checkout" to="/checkout">
                  Continue to checkout
                </Link>
                <Link className="bag__continue" to="/shop">
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
