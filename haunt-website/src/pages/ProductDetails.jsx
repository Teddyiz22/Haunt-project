import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { getProductBySlug, ApiError } from '../services/productService.js'
import { addToBag } from '../services/cartIntegration.js'
import { formatMmk } from '../utils/formatMoney.js'
import { resolveMediaUrl } from '../utils/mediaUrl.js'
import './ProductDetails.css'

export default function ProductDetails() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const [addedToBag, setAddedToBag] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNotice('')
    setAddedToBag(false)
    getProductBySlug(slug)
      .then((payload) => {
        if (cancelled) return
        const data = payload.data
        setProduct(data)
        const firstAvailable = data.variants?.find((variant) => variant.available)
        setSelectedSize(firstAvailable?.size || '')
        setQuantity(1)
        setActiveImage(0)
      })
      .catch((requestError) => {
        if (cancelled) return
        setProduct(null)
        setError(
          requestError instanceof ApiError && requestError.status === 404
            ? 'This piece is not in the collection.'
            : requestError.message || 'The product could not be loaded.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.size === selectedSize) || null,
    [product, selectedSize],
  )

  const maxQuantity = selectedVariant?.available ? Number(selectedVariant.stock_quantity) : 0

  function handleSize(size, variant) {
    if (!variant.available) return
    setSelectedSize(size)
    setQuantity(1)
    setNotice('')
    setAddedToBag(false)
  }

  function handleQuantity(nextValue) {
    if (!maxQuantity) return
    const next = Math.min(maxQuantity, Math.max(1, nextValue))
    setQuantity(next)
  }

  function handleAddToBag() {
    const result = addToBag({ product, variant: selectedVariant, quantity })
    if (!result.ok) {
      setNotice(result.reason)
      setAddedToBag(false)
      return
    }
    setNotice('Added to your bag.')
    setAddedToBag(true)
  }

  return (
    <StorefrontLayout>
      <section className="product-page">
        <div className="container product-page__container">
          {loading && <p className="muted-text">Loading the piece.</p>}
          {!loading && error && (
            <div className="catalog-state">
              <p className="section-label">Missing</p>
              <h1 className="product-page__name">{error}</h1>
              <Link className="outline-button button-text" to="/shop">Return to the collection</Link>
            </div>
          )}
          {!loading && product && (
            <div className="product-page__layout">
              <div className="product-gallery">
                <div className="product-gallery__stage">
                  {product.images?.[activeImage] ? (
                    <img
                      src={resolveMediaUrl(product.images[activeImage].url)}
                      alt={product.images[activeImage].alt_text || product.name}
                    />
                  ) : (
                    <div className="product-card__placeholder" />
                  )}
                </div>
                {product.images?.length > 1 && (
                  <div className="product-gallery__thumbs">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id || index}
                        type="button"
                        className={index === activeImage ? 'is-active' : ''}
                        onClick={() => setActiveImage(index)}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img src={resolveMediaUrl(image.url)} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-info">
                <p className="section-label">{product.category?.name || 'Drop 01'}</p>
                <h1 className="product-page__name">{product.name}</h1>
                <p className="product-page__price">{formatMmk(product.price_mmk)}</p>
                {product.description && <p className="product-page__description muted-text">{product.description}</p>}

                <fieldset className="product-info__sizes">
                  <legend>Size</legend>
                  <div className="product-info__size-row">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        className={`size-chip${selectedSize === variant.size ? ' is-selected' : ''}`}
                        disabled={!variant.available}
                        onClick={() => handleSize(variant.size, variant)}
                      >
                        {variant.size}
                      </button>
                    ))}
                  </div>
                  <p className="product-info__stock muted-text">
                    {selectedVariant
                      ? selectedVariant.available
                        ? `${selectedVariant.stock_quantity} available in ${selectedVariant.size}`
                        : `${selectedVariant.size} is unavailable`
                      : 'Select an available size'}
                  </p>
                </fieldset>

                <label className="product-info__qty">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity || 1}
                    value={quantity}
                    disabled={!maxQuantity}
                    onChange={(event) => handleQuantity(Number(event.target.value))}
                  />
                </label>

                <button
                  type="button"
                  className="outline-button button-text product-info__bag"
                  disabled={!selectedVariant?.available}
                  onClick={handleAddToBag}
                >
                  Add to bag
                </button>
                {notice && (
                  <p className="product-info__notice">
                    {notice}{' '}
                    {addedToBag && <Link to="/bag">View bag</Link>}
                  </p>
                )}
                <Link className="product-info__back" to="/shop">Back to the collection</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </StorefrontLayout>
  )
}
