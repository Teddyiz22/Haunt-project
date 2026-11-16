import { Link } from 'react-router-dom'
import { ArrowUpRight, Instagram } from 'lucide-react'
import { brandInfo } from '../data/brandInfo.js'
import './Footer.css'

const footerNavigation = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collection', to: '/#collection' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

const socialIcons = {
  instagram: Instagram,
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const configuredSocials = brandInfo.socials.filter((social) => social.url)

  return (
    <footer className="site-footer">
      <div className="container site-footer__container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link className="site-footer__wordmark" to="/" aria-label={`${brandInfo.name} home`}>
              {brandInfo.name}
            </Link>
            <p className="site-footer__slogan">Impossible to forget.</p>
            <p className="site-footer__origin">Est. {brandInfo.established} <span>—</span> {brandInfo.location}</p>
          </div>

          <nav className="site-footer__nav" aria-label="Footer navigation">
            <p className="section-label">Explore</p>
            {footerNavigation.map((item) => (
              <Link key={item.label} to={item.to}>{item.label}</Link>
            ))}
          </nav>

          <nav className="site-footer__socials" aria-label="Social connections">
            <p className="section-label">Follow HΛUNT</p>
            {configuredSocials.map((social) => {
              const Icon = socialIcons[social.name.toLowerCase()]
              return (
                <a href={social.url} key={social.name} target="_blank" rel="noreferrer">
                  {Icon && <Icon aria-hidden="true" size={15} strokeWidth={1.6} />}
                  {social.name}
                  <ArrowUpRight aria-hidden="true" size={13} />
                </a>
              )
            })}
          </nav>
        </div>

        <div className="site-footer__statement" aria-label="The things that stay with you">
          <p>The things that <em>stay with you.</em></p>
        </div>

        <div className="site-footer__bottom">
          <p>© {currentYear} {brandInfo.name}. All rights reserved.</p>
          <p>Independent streetwear label <span>—</span> {brandInfo.location}</p>
        </div>
      </div>
    </footer>
  )
}
