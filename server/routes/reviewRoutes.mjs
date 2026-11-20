import { Router } from "express";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth.mjs";
import {
  getReviews,
  createReview,
  updateReview,
  replyReview,
  reportReview,
  moderateReview,
} from "../controllers/reviewController.mjs";

const router = Router();

router.get("/reviews", optionalAuth, getReviews);
router.post("/reviews", requireAuth, createReview);
router.put("/reviews/:id", requireAuth, updateReview);
router.post("/reviews/:id/reply", requireAuth, requireRole("owner", "admin"), replyReview);
router.post("/reviews/:id/report", requireAuth, reportReview);
router.patch("/admin/reviews/:id", requireAuth, requireRole("admin"), moderateReview);

export default router;
