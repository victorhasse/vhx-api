import { Router } from 'express'
import { getAll, getById, create, update, remove } from '../controllers/productController.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/',     getAll)
router.get('/:id',  getById)
router.post('/',    authMiddleware, adminMiddleware, create)
router.put('/:id',  authMiddleware, adminMiddleware, update)
router.delete('/:id', authMiddleware, adminMiddleware, remove)

export default router