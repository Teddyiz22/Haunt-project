import * as newsletterModel from '../models/newsletterModel.js'

export async function subscribe(request, response) {
  const result = await newsletterModel.subscribeEmail(
    request.validatedBody.email,
    request.validatedBody.source,
  )
  if (result.already) {
    return response.json({
      success: true,
      data: { subscribed: false, already: true, message: 'You are already on the list.' },
    })
  }
  return response.status(201).json({
    success: true,
    data: { subscribed: true, already: false, message: 'You are on the list. Welcome to HΛUNT.' },
  })
}
