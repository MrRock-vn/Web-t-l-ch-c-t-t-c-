import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import {
  getMyNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/notificationController.mjs";

const router = Router();

router.get("/notifications", requireAuth, getMyNotifications);
router.patch("/notifications/read-all", requireAuth, markAllRead);
router.patch("/notifications/:id/read", requireAuth, markOneRead);

export default router;
