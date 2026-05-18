import { Router } from 'express'
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/',     authMiddleware, createOrder)
router.get('/',      authMiddleware, getMyOrders)
router.get('/:id',   authMiddleware, getOrderById)

export default router