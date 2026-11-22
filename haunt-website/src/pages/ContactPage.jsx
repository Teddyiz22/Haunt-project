import StorefrontLayout from '../layouts/StorefrontLayout.jsx'
import Contact from '../components/Contact.jsx'
import { usePageMeta } from '../utils/seo.js'
import './ContactPage.css'

export default function ContactPage() {
  usePageMeta({
    title: 'Contact',
    description: 'Contact HΛUNT — enquiries about Drop 01 and the brand.',
  })

  return (
    <StorefrontLayout>
      <div className="contact-page">
        <Contact asPage />
      </div>
    </StorefrontLayout>
  )
}
