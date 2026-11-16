import multer from 'multer'

export function errorHandler(error, _request, response, _next) {
  let status = Number(error.status || error.statusCode) || 500
  let message = error.message || 'An unexpected server error occurred.'

  if (error instanceof multer.MulterError) {
    status = 400
    if (error.code === 'LIMIT_FILE_SIZE') message = 'Image exceeds the 5MB limit.'
    else if (error.code === 'LIMIT_FILE_COUNT') message = 'Too many images in one request.'
    else message = 'Image upload failed.'
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }

  response.status(status).json({
    success: false,
    error: status >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : message,
  })
}
