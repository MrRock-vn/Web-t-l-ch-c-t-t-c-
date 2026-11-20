import { Router } from "express";
import { requireAuth, requireRole, requireSalonOwner, optionalAuth } from "../middleware/auth.mjs";
import {
  getSalons,
  getSalonById,
  getServices,
  getBarbers,
  getCategories,
  updateSalon,
  createService,
  updateService,
  deleteService,
  createBarber,
  updateBarber,
  deleteBarber,
} from "../controllers/salonController.mjs";

const router = Router();

// ────────────────── PUBLIC ──────────────────
router.get("/salons", optionalAuth, getSalons);
router.get("/salons/:id", getSalonById);
router.get("/services", getServices);
router.get("/barbers", getBarbers);
router.get("/categories", getCategories);

// ────────────────── OWNER / ADMIN ──────────────────
router.put("/salons/:id", requireAuth, requireRole("owner", "admin"), requireSalonOwner, updateSalon);

router.post("/services", requireAuth, requireRole("owner", "admin"), requireSalonOwner, createService);
router.put("/services/:id", requireAuth, requireRole("owner", "admin"), updateService);
router.delete("/services/:id", requireAuth, requireRole("owner", "admin"), deleteService);

router.post("/barbers", requireAuth, requireRole("owner", "admin"), requireSalonOwner, createBarber);
router.put("/barbers/:id", requireAuth, requireRole("owner", "admin"), updateBarber);
router.delete("/barbers/:id", requireAuth, requireRole("owner", "admin"), deleteBarber);

export default router;
