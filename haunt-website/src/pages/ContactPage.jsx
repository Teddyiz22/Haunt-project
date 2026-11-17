import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import Contact from '../components/Contact.jsx'
import './ContactPage.css'

export default function ContactPage() {
  return (
    <StorefrontLayout>
      <div className="contact-page">
        <Contact asPage />
      </div>
    </StorefrontLayout>
  )
}
