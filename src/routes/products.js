import { Router } from "express";
import {
  getAll,
  getById,
  getRecommendations,
  create,
  update,
  remove,
} from "../controllers/productController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

import {
  createColor,
  updateColor,
  removeColor,
} from "../controllers/productColorController.js";

import {
  createImage,
  updateImage,
  removeImage,
} from "../controllers/productImageController.js";

import {
  createVariant,
  updateVariant,
  removeVariant,
} from "../controllers/productVariantController.js";

const router = Router();

router.post("/:productId/images", authMiddleware, adminMiddleware, createImage);

router.put(
  "/:productId/images/:imageId",
  authMiddleware,
  adminMiddleware,
  updateImage,
);

router.delete(
  "/:productId/images/:imageId",
  authMiddleware,
  adminMiddleware,
  removeImage,
);

router.post("/:productId/colors", authMiddleware, adminMiddleware, createColor);

router.put(
  "/:productId/colors/:colorId",
  authMiddleware,
  adminMiddleware,
  updateColor,
);

router.delete(
  "/:productId/colors/:colorId",
  authMiddleware,
  adminMiddleware,
  removeColor,
);

router.post(
  "/:productId/variants",
  authMiddleware,
  adminMiddleware,
  createVariant,
);

router.put(
  "/:productId/variants/:variantId",
  authMiddleware,
  adminMiddleware,
  updateVariant,
);

router.delete(
  "/:productId/variants/:variantId",
  authMiddleware,
  adminMiddleware,
  removeVariant,
);

router.get("/", getAll);
router.get("/:id/recommendations", getRecommendations);
router.get("/:id", getById);
router.post("/", authMiddleware, adminMiddleware, create);
router.put("/:id", authMiddleware, adminMiddleware, update);
router.delete("/:id", authMiddleware, adminMiddleware, remove);

export default router;
