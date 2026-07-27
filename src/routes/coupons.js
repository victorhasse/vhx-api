import { Router } from "express";

import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  updateCouponStatus,
  validateCoupon,
} from "../controllers/couponController.js";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/auth.js";

const router = Router();

router.post(
  "/validate",
  authMiddleware,
  validateCoupon,
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllCoupons,
);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createCoupon,
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateCoupon,
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateCouponStatus,
);

export default router;