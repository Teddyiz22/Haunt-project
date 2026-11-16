import Hero from '../components/Hero.jsx'
import Navbar from '../components/Navbar.jsx'
import Collection from '../components/Collection.jsx'
import BrandStory from '../components/BrandStory.jsx'
import Contact from '../components/Contact.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Collection />
        <BrandStory />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
