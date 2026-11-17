import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateRegister, validateLogin } from '../validators/authValidators.js'
import * as authController from '../controllers/authController.js'

const router = Router()

router.post(
  '/register',
  validate(validateRegister),
  asyncHandler(authController.register),
)

router.post(
  '/login',
  validate(validateLogin),
  asyncHandler(authController.login),
)

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getMe),
)

export default router
