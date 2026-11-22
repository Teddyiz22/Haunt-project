import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { formatMmk } from '../utils/formatMoney.js'
import ProductImage from './ProductImage.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { addToBag } from '../services/cartIntegration.js'

function totalStock(product) {
  return (product.variants || []).reduce(
    (total, variant) => total + (variant.available ? Number(variant.stock_quantity) : 0),
    0,
  )
}

export default function ProductCard({ product }) {
  const image = product.images?.[0]
  const category = product.category?.name
  const { toggleWishlist, isWishlisted } = useWishlist()
  const { showToast } = useToast()
  const wishlisted = isWishlisted(product.slug)
  const stock = totalStock(product)
  const firstAvailable = (product.variants || []).find((variant) => variant.available)

  function handleWishlist(event) {
    event.preventDefault()
    const added = toggleWishlist(product)
    showToast(added ? `Saved ${product.name} to your wishlist.` : `Removed ${product.name} from your wishlist.`)
  }

  function handleQuickAdd(event) {
    event.preventDefault()
    if (!firstAvailable) return
    const result = addToBag({ product, variant: firstAvailable, quantity: 1 })
    if (!result.ok) {
      showToast(result.reason)
      return
    }
    showToast(`Added ${product.name} (${firstAvailable.size}) to your bag.`, {
      to: '/bag',
      actionLabel: 'View bag',
    })
  }

  return (
    <article className="product-card">
      <div className="product-card__media-wrap">
        <Link className="product-card__media" to={`/product/${product.slug}`}>
          <ProductImage
            src={image?.url}
            alt={image?.alt_text || product.name}
            productName={product.name}
          />
          {!product.in_stock && <span className="product-card__status">Sold through</span>}
          {product.in_stock && stock > 0 && stock <= 5 && (
            <span className="product-card__status product-card__status--low">Only {stock} left</span>
          )}
          {product.is_featured && product.in_stock && (
            <span className="product-card__badge">Drop 01</span>
          )}
        </Link>
        {firstAvailable && (
          <button
            type="button"
            className="product-card__quick-add"
            onClick={handleQuickAdd}
            aria-label={`Quick add ${product.name} in size ${firstAvailable.size} to your bag`}
          >
            Quick add — {firstAvailable.size}
          </button>
        )}
      </div>
      <button
        type="button"
        className={`product-card__wishlist${wishlisted ? ' is-active' : ''}`}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        aria-pressed={wishlisted}
        onClick={handleWishlist}
      >
        <Heart aria-hidden="true" size={16} strokeWidth={1.6} fill={wishlisted ? 'currentColor' : 'none'} />
      </button>
      <div className="product-card__meta">
        {category && <p className="section-label product-card__category">{category}</p>}
        <h3 className="product-card__name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="product-card__price">{formatMmk(product.price_mmk)}</p>
      </div>
    </article>
  )
}
