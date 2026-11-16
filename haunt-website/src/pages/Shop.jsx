import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { getCategories, getProducts, ApiError } from '../services/productService.js'
import './Shop.css'

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price — low to high' },
  { value: 'price_desc', label: 'Price — high to low' },
]

function CatalogState({ title, message }) {
  return (
    <div className="catalog-state" role="status">
      <p className="section-label">{title}</p>
      <p>{message}</p>
    </div>
  )
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    size: searchParams.get('size') || '',
    sort: searchParams.get('sort') || 'newest',
    featured: searchParams.get('featured') || '',
    page: searchParams.get('page') || '1',
    limit: '12',
  }), [searchParams])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((payload) => {
        if (!cancelled) setCategories(payload.data || [])
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getProducts(filters)
      .then((payload) => {
        if (cancelled) return
        setProducts(payload.data || [])
        setPagination(payload.pagination || { page: 1, total_pages: 1, total: 0 })
      })
      .catch((requestError) => {
        if (cancelled) return
        setProducts([])
        setError(requestError instanceof ApiError ? requestError.message : 'The collection could not be loaded.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters])

  return (
    <StorefrontLayout>
      <section className="shop">
        <div className="container shop__container">
          <header className="shop__header">
            <p className="section-label">HΛUNT — DROP 01</p>
            <h1 className="shop__title">The Collection</h1>
            <p className="shop__lede muted-text">Pieces from the first chapter, listed as they become available.</p>
          </header>

          <form className="shop__filters" onSubmit={(event) => event.preventDefault()}>
            <label className="shop__field">
              <span>Search</span>
              <input
                type="search"
                value={filters.search}
                placeholder="Search by name"
                onChange={(event) => updateFilter('search', event.target.value)}
              />
            </label>

            <label className="shop__field">
              <span>Category</span>
              <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </label>

            <label className="shop__field">
              <span>Size</span>
              <select value={filters.size} onChange={(event) => updateFilter('size', event.target.value)}>
                <option value="">All</option>
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>

            <label className="shop__field">
              <span>Sort</span>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="shop__check">
              <input
                type="checkbox"
                checked={filters.featured === 'true'}
                onChange={(event) => updateFilter('featured', event.target.checked ? 'true' : '')}
              />
              Featured
            </label>
          </form>

          {loading && <CatalogState title="Loading" message="Retrieving the collection." />}
          {!loading && error && <CatalogState title="Unavailable" message={error} />}
          {!loading && !error && products.length === 0 && (
            <CatalogState title="No pieces" message="Nothing matches these filters in Drop 01." />
          )}
          {!loading && !error && products.length > 0 && <ProductGrid products={products} />}

          {!loading && !error && pagination.total_pages > 1 && (
            <nav className="shop__pagination" aria-label="Collection pages">
              <button
                type="button"
                className="outline-button button-text"
                disabled={Number(pagination.page) <= 1}
                onClick={() => updateFilter('page', String(Number(pagination.page) - 1))}
              >
                Previous
              </button>
              <p className="muted-text">
                {pagination.page} / {pagination.total_pages}
              </p>
              <button
                type="button"
                className="outline-button button-text"
                disabled={Number(pagination.page) >= pagination.total_pages}
                onClick={() => updateFilter('page', String(Number(pagination.page) + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
