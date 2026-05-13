import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Orders — em breve' })
})

export default router