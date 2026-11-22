import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { validateNewsletterSubscribe } from '../validators/newsletterValidators.js'
import * as newsletterController from '../controllers/newsletterController.js'

const router = Router()

router.post(
  '/',
  validate(validateNewsletterSubscribe),
  asyncHandler(newsletterController.subscribe),
)

export default router
