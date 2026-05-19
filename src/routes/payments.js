import { Router } from 'express'
import { createPaymentIntent, confirmPayment } from '../controllers/paymentController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/create-intent', authMiddleware, createPaymentIntent)
router.post('/confirm',       authMiddleware, confirmPayment)

export default router