import { Router } from 'express'

import {
  createPaymentIntent,
  confirmPayment,
  cancelPayment,
} from '../controllers/paymentController.js'

import {
  authMiddleware,
} from '../middleware/auth.js'

const router = Router()

router.post(
  '/create-intent',
  authMiddleware,
  createPaymentIntent
)

router.post(
  '/confirm',
  authMiddleware,
  confirmPayment
)

router.post(
  '/cancel',
  authMiddleware,
  cancelPayment
)

export default router