const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateNewsletterSubscribe(request) {
  const errors = []
  const body = request.body || {}
  const email = asTrimmedString(body.email).toLowerCase()
  const source = asTrimmedString(body.source).slice(0, 40) || 'website'

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push('email is required and must be a valid email address.')
  }

  request.validatedBody = { email, source }
  return errors
}
