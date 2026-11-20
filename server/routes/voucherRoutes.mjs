import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.mjs";
import {
  getVouchers,
  validateVoucher,
  createVoucher,
  deleteVoucher,
} from "../controllers/voucherController.mjs";

const router = Router();

router.get("/vouchers", getVouchers);
router.post("/vouchers/validate", validateVoucher);
router.post("/vouchers", requireAuth, requireRole("admin", "owner"), createVoucher);
router.delete("/vouchers/:code", requireAuth, requireRole("admin"), deleteVoucher);

export default router;
