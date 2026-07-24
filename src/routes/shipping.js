import {
  Router,
} from 'express'

import {
  quoteShipping,
} from '../controllers/shippingController.js'

const router = Router()

router.post(
  '/quote',
  quoteShipping
)

export default router