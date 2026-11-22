import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        {/* Temporary Pexels image by Husien Bisky; replace with the official campaign photo. */}
        <img
          className="hero__image"
          src="/images/hero/hero-campaign.jpg"
          alt=""
          fetchPriority="high"
        />
        <div className="hero__shade" />
      </div>

      <div className="hero__inner container">
        <div className="hero__copy">
          <p className="section-label hero__eyebrow">
            Independent streetwear <span aria-hidden="true">—</span> Myanmar
          </p>

          <h1 className="hero__title" id="hero-title">
            <img
              src="/images/haunt-logo-transparent.png"
              alt="HΛUNT — The things that stay with you."
            />
          </h1>

          <div className="hero__collection">
            <p className="section-label hero__drop">Drop 01 <span>—</span> Eyes of Life</p>
            <p className="hero__quote">“The more you see, the less you know.”</p>
          </div>

          <Link className="outline-button button-text hero__cta" to="/shop">
            <span>Explore the collection</span>
            <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} />
          </Link>
        </div>

        <a className="hero__scroll" href="#collection" aria-label="Scroll to the collection">
          <span>Scroll to discover</span>
          <ArrowDown aria-hidden="true" size={16} strokeWidth={1.5} />
        </a>

        <p className="hero__established">Independent label <span>·</span> Est. 2026</p>
      </div>
    </section>
  )
}
