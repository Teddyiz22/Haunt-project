import { ArrowDownRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Collection.css'

export default function Collection() {
  return (
    <section className="collection" id="collection" aria-labelledby="collection-title">
      <div className="container collection__container">
        <header className="collection__header">
          <p className="section-label collection__eyebrow">The first chapter <span>—</span> 2026</p>

          <div className="collection__intro">
            <div className="collection__title-block">
              <h2 className="collection__title" id="collection-title">Drop 01</h2>
              <p className="collection__name">Eyes of Life</p>
            </div>

            <div className="collection__statement">
              <p className="collection__quote">The more you see, the less you know.</p>
              <p className="collection__support">Not everything is meant to be understood.</p>
            </div>
          </div>
        </header>

        <div className="collection__gallery" id="collection-gallery">
          <figure className="collection__figure collection__figure--front">
            <div className="collection__image-wrap">
              <img
                className="collection__image"
                src="/images/collection/drop01-front.png"
                alt="HΛUNT Eyes of Life Tee in black, front view with the small chest print"
                loading="lazy"
              />
              <span className="collection__view-label">Front</span>
            </div>
            <figcaption className="collection__photo-caption">
              <span>Black — front</span>
              <span>01 / 02</span>
            </figcaption>
          </figure>

          <div className="collection__aside">
            <figure className="collection__figure collection__figure--back">
              <div className="collection__image-wrap">
                <img
                  className="collection__image"
                  src="/images/collection/drop01-back.png"
                  alt="HΛUNT Eyes of Life Tee in black, back view with the full Eyes of Life print"
                  loading="lazy"
                />
                <span className="collection__view-label">Back</span>
              </div>
              <figcaption className="collection__photo-caption">
                <span>Black — back</span>
                <span>02 / 02</span>
              </figcaption>
            </figure>

            <div className="collection__product-info">
              <p className="section-label collection__product-kicker">Drop 01 / 2026</p>
              <h3 className="collection__product-name">HΛUNT <span>—</span> Eyes of Life Tee</h3>
              <p className="collection__fit">Oversized fit</p>
              <p className="collection__philosophy">The things that stay with you.</p>

              <Link className="outline-button button-text collection__cta" to="/product/haunt-eyes-of-life-tee">
                <span>Discover the piece</span>
                <ArrowDownRight aria-hidden="true" size={17} strokeWidth={1.5} />
              </Link>
              <Link className="collection__all-link" to="/collection">View all collections</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
