import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { optionalAuthenticate } from '../middleware/authenticate.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { productImageUpload } from '../middleware/productImageUpload.js'
import {
  validateListQuery,
  validateProductWrite,
  validateProductIdParam,
  validateSlugParam,
} from '../validators/productValidators.js'
import * as productController from '../controllers/productController.js'

const router = Router()

router.get(
  '/',
  validate(validateListQuery),
  asyncHandler(productController.listProducts),
)

router.get(
  '/:slug',
  validate(validateSlugParam),
  asyncHandler(productController.getProduct),
)

export const categoryRouter = Router()
categoryRouter.get('/', asyncHandler(productController.listCategories))

export const adminProductRouter = Router()
// An admin JWT (Step 11) is accepted first; requireAdmin keeps its existing
// ADMIN_API_TOKEN fallback, so both ways to administer keep working.
adminProductRouter.use(optionalAuthenticate)
adminProductRouter.use(requireAdmin)

adminProductRouter.post(
  '/',
  validate(validateProductWrite),
  asyncHandler(productController.createProduct),
)

adminProductRouter.get(
  '/:id',
  validate(validateProductIdParam),
  asyncHandler(productController.getAdminProduct),
)

adminProductRouter.put(
  '/:id',
  validate(validateProductIdParam),
  validate(validateProductWrite),
  asyncHandler(productController.updateProduct),
)

adminProductRouter.delete(
  '/:id',
  validate(validateProductIdParam),
  asyncHandler(productController.deleteProduct),
)

adminProductRouter.post(
  '/:id/images',
  validate(validateProductIdParam),
  (request, response, next) => {
    productImageUpload(request, response, (error) => {
      if (error) return next(error)
      return next()
    })
  },
  asyncHandler(productController.uploadProductImages),
)

adminProductRouter.delete(
  '/:id/images/:imageId',
  validate(validateProductIdParam),
  asyncHandler(productController.deleteProductImage),
)

export default router
