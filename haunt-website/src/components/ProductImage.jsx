import { useState } from 'react'
import { resolveMediaUrl } from '../utils/mediaUrl.js'

// Branded photo tile used everywhere a product photo belongs. Real photos
// are still to be shot; until then a missing or broken image never shows
// as an empty box — it shows the HΛUNT mark instead.
export function BrandPhotoPlaceholder({ productName, compact = false }) {
  return (
    <div className={`brand-photo${compact ? ' brand-photo--compact' : ''}`} aria-hidden="true">
      <span className="brand-photo__mark">H</span>
      <span className="brand-photo__word">HΛUNT</span>
      {!compact && (
        <span className="brand-photo__note">
          {productName ? `${productName} — photo coming soon` : 'Photo coming soon'}
        </span>
      )}
    </div>
  )
}

export default function ProductImage({ src, alt, productName, className, compact = false }) {
  const [failed, setFailed] = useState(false)
  const url = src ? resolveMediaUrl(src) : ''

  if (!url || failed) {
    return <BrandPhotoPlaceholder productName={productName} compact={compact} />
  }

  return (
    <img
      src={url}
      alt={alt || productName || ''}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
