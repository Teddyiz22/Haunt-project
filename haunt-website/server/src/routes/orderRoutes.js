import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { validateOrderCreate, validateOrderLookup } from '../validators/orderValidators.js'
import * as orderController from '../controllers/orderController.js'

const router = Router()

router.post(
  '/',
  validate(validateOrderCreate),
  asyncHandler(orderController.createOrder),
)

router.get(
  '/:orderNumber',
  validate(validateOrderLookup),
  asyncHandler(orderController.getOrder),
)

export default router
