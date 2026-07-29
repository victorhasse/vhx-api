import { Router } from "express";

import {
  getMyCashbackBalance,
  getMyCashbackTransactions,
} from "../controllers/cashbackController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get(
  "/balance",
  authMiddleware,
  getMyCashbackBalance,
);

router.get(
  "/transactions",
  authMiddleware,
  getMyCashbackTransactions,
);

export default router;