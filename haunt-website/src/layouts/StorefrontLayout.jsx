import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function StorefrontLayout({ children, overlay = false }) {
  return (
    <>
      <Navbar overlay={overlay} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
