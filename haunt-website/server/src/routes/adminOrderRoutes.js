import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { optionalAuthenticate } from '../middleware/authenticate.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import {
  validateAdminOrderList,
  validateAdminOrderStatus,
} from '../validators/adminOrderValidators.js'
import * as orderController from '../controllers/orderController.js'

const router = Router()

// Same pattern as the admin product routes: an admin JWT is accepted first;
// requireAdmin keeps its ADMIN_API_TOKEN fallback.
router.use(optionalAuthenticate)
router.use(requireAdmin)

router.get(
  '/',
  validate(validateAdminOrderList),
  asyncHandler(orderController.listAdminOrders),
)

router.patch(
  '/:orderNumber/status',
  validate(validateAdminOrderStatus),
  asyncHandler(orderController.changeOrderStatus),
)

export default router
