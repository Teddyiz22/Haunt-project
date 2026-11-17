import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight } from 'lucide-react'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { getProductBySlug } from '../services/productService.js'
import { formatMmk } from '../utils/formatMoney.js'
import './Collection.css'

const PRODUCT_SLUG = 'haunt-eyes-of-life-tee'

export default function Collection() {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    let cancelled = false
    getProductBySlug(PRODUCT_SLUG)
      .then((payload) => {
        if (!cancelled) setProduct(payload.data || null)
      })
      .catch(() => {
        if (!cancelled) setProduct(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <StorefrontLayout>
      <section className="collection-page">
        <div className="container">
          <header className="collection-page__header">
            <p className="section-label">HΛUNT — Every drop tells a story</p>
            <h1 className="collection-page__title">The Collections</h1>
            <p className="muted-text collection-page__lede">
              Each HΛUNT collection represents a different chapter. From the ideas we question to the things we carry, every release explores a different perspective while remaining connected to the same identity.
            </p>
          </header>

          <div className="collection-page__entries">
            <article className="collection-page__entry" aria-labelledby="drop-01-title">
              <div className="collection-page__gallery">
                <figure className="collection-page__figure">
                  {/* Temporary styling reference by Ruslan Alekso on Pexels, not a HΛUNT product photo. */}
                  <div className="collection-page__image-wrap">
                    <img
                      className="collection-page__image"
                      src="/images/collection/drop01-front.jpg"
                      alt="Temporary styling reference showing a black oversized T-shirt with a front graphic"
                      loading="lazy"
                    />
                    <span className="collection-page__view-label">Front reference</span>
                  </div>
                  <figcaption className="collection-page__photo-caption">
                    <span>Campaign reference</span>
                    <span>01 / 02</span>
                  </figcaption>
                </figure>

                <figure className="collection-page__figure">
                  {/* Temporary styling reference by Labskiii on Pexels, not a HΛUNT product photo. */}
                  <div className="collection-page__image-wrap">
                    <img
                      className="collection-page__image"
                      src="/images/collection/drop01-back.jpg"
                      alt="Temporary styling reference showing a black T-shirt with a distinctive back graphic"
                      loading="lazy"
                    />
                    <span className="collection-page__view-label">Back reference</span>
                  </div>
                  <figcaption className="collection-page__photo-caption">
                    <span>Temporary visual reference</span>
                    <span>02 / 02</span>
                  </figcaption>
                </figure>
              </div>

              <div className="collection-page__details">
                <p className="section-label">Drop 01 <span>—</span> 2026</p>
                <h2 className="collection-page__drop-title" id="drop-01-title">EYES OF LIFE</h2>
                <p className="collection-page__quote">The more you see, the less you know.</p>
                <p className="collection-page__description">
                  An exploration of observation, perspective, and the complexity of understanding life.
                </p>

                <div className="collection-page__product">
                  <p className="collection-page__product-name">HΛUNT <span>—</span> Eyes of Life Tee</p>
                  <p className="collection-page__product-fit">Oversized fit</p>
                  {product && (
                    <p className="collection-page__product-price">{formatMmk(product.price_mmk)}</p>
                  )}
                </div>

                <div className="collection-page__actions">
                  <Link className="outline-button button-text" to={`/product/${PRODUCT_SLUG}`}>
                    <span>Discover the piece</span>
                    <ArrowDownRight aria-hidden="true" size={17} strokeWidth={1.5} />
                  </Link>
                  <Link className="collection-page__shop-link" to="/shop">Shop Drop 01</Link>
                </div>

                <p className="collection-page__disclaimer">
                  Placeholder photography. Replace with official HΛUNT product images.
                </p>
              </div>
            </article>

            <article className="collection-page__entry collection-page__entry--coming" aria-labelledby="vol-02-title">
              <div className="collection-page__details">
                <p className="section-label">Vol. 02</p>
                <h2 className="collection-page__drop-title" id="vol-02-title">WHAT REMAINS</h2>
                <p className="collection-page__description">
                  A reflection on memories, impressions, and the things that stay with us.
                </p>
                <p className="collection-page__status">Coming soon</p>
                <p className="muted-text collection-page__coming-note">
                  No pieces are available from this volume yet.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  )
}
