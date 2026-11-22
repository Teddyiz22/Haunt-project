import { useEffect } from 'react'

const SITE_NAME = 'HΛUNT'

function setMeta(name, content, attribute = 'name') {
  if (!content) return
  let tag = document.querySelector(`meta[${attribute}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// Per-page title + description + Open Graph tags. Call at the top of a page
// component; the values reset on the next navigation.
export function usePageMeta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Impossible to Forget`
    document.title = fullTitle
    setMeta('description', description || 'HΛUNT — an independent Myanmar streetwear label. The things that stay with you.')
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description || 'HΛUNT — an independent Myanmar streetwear label. The things that stay with you.', 'property')
    setMeta('og:type', 'website', 'property')
  }, [title, description])
}
