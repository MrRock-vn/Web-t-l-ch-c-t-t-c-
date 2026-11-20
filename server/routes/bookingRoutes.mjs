import { Router } from "express";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth.mjs";
import {
  getAvailability,
  createBooking,
  getMyBookings,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
} from "../controllers/bookingController.mjs";

const router = Router();

router.get("/salons/:id/availability", optionalAuth, getAvailability);
router.post("/bookings", requireAuth, createBooking);
router.get("/bookings/mine", requireAuth, getMyBookings);
router.patch("/bookings/:id/status", requireAuth, requireRole("owner", "admin"), updateBookingStatus);
router.post("/bookings/:id/cancel", requireAuth, cancelBooking);
router.patch("/bookings/:id/reschedule", requireAuth, rescheduleBooking);

export default router;
