import { Router } from "express";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

import {
  authMiddleware,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getWishlist,
);

router.post(
  "/:productId",
  authMiddleware,
  addToWishlist,
);

router.delete(
  "/:productId",
  authMiddleware,
  removeFromWishlist,
);

export default router;