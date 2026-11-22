import Hero from '../components/Hero.jsx'
import Navbar from '../components/Navbar.jsx'
import Collection from '../components/Collection.jsx'
import FeaturedDrop from '../components/FeaturedDrop.jsx'
import BrandStory from '../components/BrandStory.jsx'
import Contact from '../components/Contact.jsx'
import NewsletterSignup from '../components/NewsletterSignup.jsx'
import Footer from '../components/Footer.jsx'
import { usePageMeta } from '../utils/seo.js'

export default function Home() {
  usePageMeta({
    title: '',
    description: 'HΛUNT — an independent Myanmar streetwear label. Drop 01: Eyes of Life. The things that stay with you.',
  })

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedDrop />
        <Collection />
        <BrandStory />
        <section className="home-newsletter" aria-label="Newsletter signup">
          <div className="container">
            <NewsletterSignup source="home" />
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  )
}
