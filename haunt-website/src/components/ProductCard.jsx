import { Link } from 'react-router-dom'
import { formatMmk } from '../utils/formatMoney.js'
import { resolveMediaUrl } from '../utils/mediaUrl.js'

export default function ProductCard({ product }) {
  const image = product.images?.[0]
  const category = product.category?.name

  return (
    <article className="product-card">
      <Link className="product-card__media" to={`/product/${product.slug}`}>
        {image ? (
          <img
            src={resolveMediaUrl(image.url)}
            alt={image.alt_text || product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-card__placeholder" aria-hidden="true" />
        )}
        {!product.in_stock && <span className="product-card__status">Sold through</span>}
      </Link>
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
