import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateOrderCreate, validateOrderLookup } from '../validators/orderValidators.js'
import * as orderController from '../controllers/orderController.js'

const router = Router()

router.post(
  '/',
  validate(validateOrderCreate),
  asyncHandler(orderController.createOrder),
)

// Signed-in order history, matched by the account email. Registered before
// /:orderNumber so "mine" is never read as an order number.
router.get(
  '/mine',
  authenticate,
  asyncHandler(orderController.listMyOrders),
)

router.get(
  '/:orderNumber',
  validate(validateOrderLookup),
  asyncHandler(orderController.getOrder),
)

export default router
