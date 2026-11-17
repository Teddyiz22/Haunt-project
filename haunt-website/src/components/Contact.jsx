import { useState } from 'react'
import { ArrowUpRight, Instagram } from 'lucide-react'
import { brandInfo } from '../data/brandInfo.js'
import './Contact.css'

const enquiryTypes = [
  {
    title: 'General enquiries',
    description: 'For questions about HΛUNT, our releases, or the ideas behind the label.',
  },
  {
    title: 'Collaborations',
    description: 'For considered creative partnerships, projects, and cultural conversations.',
  },
  {
    title: 'Customer support',
    description: 'For help with product information and order related questions.',
  },
]

const initialValues = { name: '', email: '', subject: '', message: '' }

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your full name.'
  if (!values.email.trim()) errors.email = 'Please enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!values.subject.trim()) errors.subject = 'Please enter a subject.'
  if (!values.message.trim()) errors.message = 'Please enter a message.'
  return errors
}

export default function Contact({ asPage = false }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const Heading = asPage ? 'h1' : 'h2'

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitted(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setSubmitted(false)
      return
    }

    // Frontend demonstration only. No personal data is stored or transmitted.
    setSubmitted(true)
  }

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="container contact__container">
        <header className="contact__header">
          <p className="section-label">{asPage ? 'Contact' : 'A conversation starts here'} <span>—</span> {brandInfo.location}</p>
          <Heading className="contact__title" id="contact-title">Let’s <em>connect.</em></Heading>
          <p className="contact__intro">For questions, collaborations, or anything else, get in touch.</p>
        </header>

        <div className="contact__layout">
          <aside className="contact__details" aria-label="Contact information">
            <div className="contact__channels">
              {enquiryTypes.map((type, index) => (
                <article className="contact__channel" key={type.title}>
                  <span className="contact__channel-number">0{index + 1}</span>
                  <div>
                    <h3>{type.title}</h3>
                    <p>{type.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="contact__direct">
              <p className="section-label">Direct contact</p>
              {brandInfo.email ? (
                <a className="contact__email" href={`mailto:${brandInfo.email}`}>
                  {brandInfo.email}<ArrowUpRight aria-hidden="true" size={16} />
                </a>
              ) : (
                <p className="contact__placeholder">{brandInfo.emailPlaceholder} — TO BE ANNOUNCED</p>
              )}
              {brandInfo.socials.filter((social) => social.url).map((social) => (
                <a
                  className="contact__social"
                  href={social.url}
                  key={social.name}
                  target="_blank"
                  rel="noreferrer"
                >
                  {social.name === 'Instagram' && <Instagram aria-hidden="true" size={16} />}
                  {social.name}<ArrowUpRight aria-hidden="true" size={14} />
                </a>
              ))}
              {!brandInfo.socials.some((social) => social.url) && (
                <p className="contact__social-placeholder">Instagram — TO BE ANNOUNCED</p>
              )}
            </div>
          </aside>

          <div className="contact__form-wrap">
            <form className="contact__form" onSubmit={handleSubmit} noValidate>
              <div className="contact__form-heading">
                <h3>Send an enquiry</h3>
                <p>Fields marked * are required.</p>
              </div>

              <div className="contact__field-grid">
                <div className="contact__field">
                  <label htmlFor="contact-name">Full name <span>*</span></label>
                  <input id="contact-name" name="name" autoComplete="name" value={values.name} onChange={handleChange} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined} />
                  {errors.name && <p className="contact__error" id="contact-name-error">{errors.name}</p>}
                </div>
                <div className="contact__field">
                  <label htmlFor="contact-email">Email address <span>*</span></label>
                  <input id="contact-email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined} />
                  {errors.email && <p className="contact__error" id="contact-email-error">{errors.email}</p>}
                </div>
              </div>
              <div className="contact__field">
                <label htmlFor="contact-subject">Subject <span>*</span></label>
                <input id="contact-subject" name="subject" value={values.subject} onChange={handleChange} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'contact-subject-error' : undefined} />
                {errors.subject && <p className="contact__error" id="contact-subject-error">{errors.subject}</p>}
              </div>
              <div className="contact__field">
                <label htmlFor="contact-message">Message <span>*</span></label>
                <textarea id="contact-message" name="message" rows="4" value={values.message} onChange={handleChange} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : undefined} />
                {errors.message && <p className="contact__error" id="contact-message-error">{errors.message}</p>}
              </div>

              <p className="contact__demo-notice" role="note">
                This form is a frontend demonstration. Messages are not sent or stored. Please use the direct contact details once they are published.
              </p>
              <button className="contact__submit button-text" type="submit">
                Send message <ArrowUpRight aria-hidden="true" size={17} />
              </button>
              <div className="contact__feedback" aria-live="polite" role={submitted ? 'status' : undefined}>
                {submitted && 'Thank you. Your details were checked, but this demonstration cannot send your message.'}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
