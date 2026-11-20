import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.mjs";
import {
  getOverview,
  getUsers,
  lockUser,
  manageSalon,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/adminController.mjs";

const router = Router();

// Tất cả route admin đều cần requireAuth + requireRole('admin')
router.use(requireAuth, requireRole("admin"));

router.get("/overview", getOverview);
router.get("/users", getUsers);
router.patch("/users/:id/lock", lockUser);
router.patch("/salons/:id", manageSalon);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

export default router;
