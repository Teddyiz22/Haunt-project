// Keep catalog images on the current origin so local Vite can proxy /uploads.
export function resolveMediaUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname
    return parsed.href
  } catch {
    return url
  }
}
