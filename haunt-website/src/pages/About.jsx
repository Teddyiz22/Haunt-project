import { Link } from 'react-router-dom'
import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import { usePageMeta } from '../utils/seo.js'
import './About.css'

const sections = [
  {
    number: '01',
    title: 'THE MEANING',
    subtitle: 'WHAT STAYS, NEVER REALLY LEAVES.',
    paragraphs: [
      'HΛUNT takes inspiration from the idea of being unforgettable.',
      'A thought, a memory, a feeling, or a moment can stay with us long after it has passed.',
      "That's the meaning behind HΛUNT.",
      'Not about following what everyone else sees, but about creating something that leaves its own presence.',
      'Something worth remembering.',
    ],
  },
  {
    number: '02',
    title: 'OUR PHILOSOPHY',
    subtitle: 'MORE THAN WHAT YOU WEAR.',
    paragraphs: [
      "We believe individuality doesn't need permission.",
      'Style is personal. Perspective is different. And not everything needs to be understood by everyone.',
      'HΛUNT exists for those who appreciate expression, explore their own identity, and find meaning in the details.',
      "We don't create simply to follow trends. We create to express ideas.",
    ],
  },
  {
    number: '03',
    title: 'OUR CREATIVE DIRECTION',
    subtitle: 'DESIGNED WITH INTENTION.',
    paragraphs: [
      'Every collection begins with an idea.',
      'Through typography, graphics, silhouettes, and visual storytelling, we explore different perspectives and translate them into wearable expressions.',
      'Our approach combines minimalism, darker aesthetics, and distinctive visual details.',
      'Every piece should have a reason to exist.',
    ],
  },
]

export default function About() {
  usePageMeta({
    title: 'About',
    description: 'HΛUNT — the meaning behind the brand. Memories, identity, presence, individuality. The things that stay with you.',
  })

  return (
    <StorefrontLayout>
      <article className="about">
        <div className="container">
          <header className="about__header">
            <p className="section-label">About HΛUNT</p>
            <h1 className="about__title">The things that stay with you.</h1>
            <div className="about__intro">
              <p>HΛUNT is an independent streetwear label built around identity, expression, and the things that leave a lasting impression.</p>
              <p>We believe clothing is more than something you wear. It's an extension of how you see yourself, how you express yourself, and how you choose to exist in the world.</p>
              <p>We create pieces that carry meaning beyond their appearance.</p>
            </div>
          </header>

          <div className="about__sections">
            {sections.map((section) => (
              <section className="about__section" key={section.number} aria-labelledby={`about-${section.number}`}>
                <p className="about__number">{section.number} <span>—</span> {section.title}</p>
                <h2 className="about__subtitle" id={`about-${section.number}`}>{section.subtitle}</h2>
                <div className="about__body">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="about__section" aria-labelledby="about-04">
              <p className="about__number">04 <span>—</span> THE COLLECTIONS</p>
              <h2 className="about__subtitle" id="about-04">EVERY DROP TELLS A STORY.</h2>
              <div className="about__body">
                <p>Each HΛUNT collection represents a different chapter.</p>
                <p>From the ideas we question to the things we carry, every release explores a different perspective while remaining connected to the same identity.</p>
              </div>

              <div className="about__drops">
                <article className="about__drop">
                  <p className="section-label">Drop 01</p>
                  <h3 className="about__drop-name">EYES OF LIFE</h3>
                  <p>An exploration of observation, perspective, and the complexity of understanding life.</p>
                  <div className="about__drop-links">
                    <Link className="outline-button button-text" to="/collection">View the collection</Link>
                    <Link className="about__drop-link" to="/product/haunt-eyes-of-life-tee">Eyes of Life Tee</Link>
                  </div>
                </article>

                <article className="about__drop">
                  <p className="section-label">Vol. 02</p>
                  <h3 className="about__drop-name">WHAT REMAINS</h3>
                  <p>A reflection on memories, impressions, and the things that stay with us.</p>
                  <p className="about__drop-status">Coming soon</p>
                </article>
              </div>
            </section>

            <section className="about__section" aria-labelledby="about-05">
              <p className="about__number">05 <span>—</span> OUR PURPOSE</p>
              <h2 className="about__subtitle" id="about-05">NOT JUST ANOTHER LABEL.</h2>
              <div className="about__body">
                <p>We aim to build more than a clothing brand.</p>
                <p>We want to create a recognizable identity through thoughtful design, meaningful concepts, and pieces made to become part of individual expression.</p>
                <p>Independent in spirit. Distinctive by design.</p>
              </div>
            </section>
          </div>

          <footer className="about__closing">
            <img
              className="about__closing-logo"
              src="/images/haunt-logo-transparent.png"
              alt="HΛUNT — The things that stay with you."
            />
            <p className="about__closing-established">EST. 2026</p>
          </footer>
        </div>
      </article>
    </StorefrontLayout>
  )
}
