import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import ProductGrid from './ProductGrid.jsx'
import { ProductGridSkeleton } from './Skeleton.jsx'
import { getProducts, ApiError } from '../services/productService.js'

// Live Drop 01 feature row on the home page: real products from the API,
// never hard-coded, with a branded placeholder while photos are missing.
export default function FeaturedDrop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getProducts({ featured: 'true', limit: '6' })
      .then((payload) => {
        if (!cancelled) setProducts(payload.data || [])
      })
      .catch((requestError) => {
        if (!cancelled) {
          setProducts([])
          setError(requestError instanceof ApiError ? requestError.message : 'The collection could not be loaded.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="featured-drop" aria-labelledby="featured-drop-title">
      <div className="container">
        <header className="featured-drop__header">
          <div>
            <p className="section-label">Drop 01 — Eyes of Life</p>
            <h2 className="editorial-heading featured-drop__title" id="featured-drop-title">
              The first chapter
            </h2>
          </div>
          <Link className="outline-button button-text" to="/shop">
            <span>Shop all of Drop 01</span>
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
          </Link>
        </header>

        {loading && <ProductGridSkeleton count={3} />}
        {!loading && error && (
          <div className="catalog-state" role="status">
            <p className="section-label">Unavailable</p>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="catalog-state" role="status">
            <p className="section-label">Nothing yet</p>
            <p>Drop 01 pieces will appear here as they become available.</p>
          </div>
        )}
        {!loading && !error && products.length > 0 && <ProductGrid products={products} />}
      </div>
    </section>
  )
}
