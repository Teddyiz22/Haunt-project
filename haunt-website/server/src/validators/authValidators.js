// Authentication validators. Each validator receives the request, returns an
// array of readable validation errors, and stores the cleaned payload on the
// request (validatedBody) for the controller, following the
// orderValidators/productValidators pattern.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateEmail(request, errors) {
  const email = asTrimmedString(request.body?.email).toLowerCase()
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push('email is required and must be a valid email address.')
  }
  return email
}

function validatePassword(request, errors, { required = true } = {}) {
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!password && !required) return password
  if (
    !password
    || password.length < PASSWORD_MIN_LENGTH
    || password.length > PASSWORD_MAX_LENGTH
  ) {
    errors.push(
      `password is required and must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
    )
  }
  return password
}

export function validateRegister(request) {
  const errors = []
  const body = request.body || {}

  const firstName = asTrimmedString(body.first_name)
  const lastName = asTrimmedString(body.last_name)
  const email = validateEmail(request, errors)
  const password = validatePassword(request, errors)

  if (!firstName || firstName.length > 100) {
    errors.push('first_name is required and must be at most 100 characters.')
  }
  if (!lastName || lastName.length > 100) {
    errors.push('last_name is required and must be at most 100 characters.')
  }

  request.validatedBody = {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
  }
  return errors
}

export function validateLogin(request) {
  const errors = []
  const email = validateEmail(request, errors)
  const password = validatePassword(request, errors, { required: true })

  request.validatedBody = { email, password }
  return errors
}
