import './BrandStory.css'

export default function BrandStory() {
  return (
    <section className="brand-story" id="about" aria-labelledby="brand-story-title">
      <div className="container brand-story__container">
        <header className="brand-story__header">
          <p className="section-label brand-story__eyebrow">
            Who we are <span aria-hidden="true">—</span> The HΛUNT philosophy
          </p>
          <p className="brand-story__index" aria-hidden="true">01 / 03</p>
        </header>

        <div className="brand-story__content">
          <div className="brand-story__title-wrap">
            <span className="brand-story__monogram" aria-hidden="true">H</span>
            <h2 className="brand-story__title" id="brand-story-title">
              The things<br />that stay <em>with you.</em>
            </h2>
          </div>

          <div className="brand-story__copy">
            <p className="brand-story__lead">Some things disappear with time. Others remain.</p>
            <p>
              HΛUNT explores the impressions, memories, and experiences that leave something
              behind. Inspired by individuality and the lasting impact of what we see, feel,
              and experience.
            </p>
            <p>
              We believe clothing can be more than something you wear. It can represent a
              moment, an identity, or something impossible to forget.
            </p>
          </div>
        </div>

        <footer className="brand-story__closing">
          <p className="section-label">Established 2026</p>
          <p className="brand-story__signature"><span>HΛUNT</span> — Impossible to forget.</p>
          <span className="brand-story__rule" aria-hidden="true" />
        </footer>
      </div>
    </section>
  )
}
