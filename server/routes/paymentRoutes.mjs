import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.mjs";
import {
  getPayments,
  createVnpayUrl,
  vnpayReturn,
  requestRefund,
  approveRefund,
} from "../controllers/paymentController.mjs";

const router = Router();

router.get("/payments", requireAuth, getPayments);
router.post("/payments/vnpay/create", requireAuth, createVnpayUrl);
router.get("/payments/vnpay/return", vnpayReturn);
router.post("/payments/:bookingId/refund-request", requireAuth, requestRefund);
router.patch("/admin/payments/:bookingId/refund", requireAuth, requireRole("admin"), approveRefund);

export default router;
