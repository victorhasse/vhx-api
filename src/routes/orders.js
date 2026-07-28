import { Router } from "express";

import {
  getAdminOrders,
  getMyOrders,
  getOrderById,
  updateAdminOrder,
} from "../controllers/orderController.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/admin/all", authMiddleware, adminMiddleware, getAdminOrders);

router.patch("/admin/:id", authMiddleware, adminMiddleware, updateAdminOrder);

router.get("/", authMiddleware, getMyOrders);

router.get("/:id", authMiddleware, getOrderById);

export default router;
