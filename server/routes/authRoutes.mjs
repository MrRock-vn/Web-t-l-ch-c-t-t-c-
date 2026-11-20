import { Router } from "express";
import { register, login, getMe, updateProfile, changePassword, logout } from "../controllers/authController.mjs";
import { requireAuth } from "../middleware/auth.mjs";
import { validate } from "../middleware/validate.mjs";
import { createRateLimiter, issueCsrfToken } from "../middleware/security.mjs";

const router = Router();

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Bạn đã thử quá nhiều lần. Vui lòng đợi trước khi thử lại.",
});

const validateLogin = validate({
  body: {
    email: { required: true, type: "string", maxLength: 150, label: "Email" },
    password: { required: true, type: "string", maxLength: 128, label: "Mật khẩu" },
  },
});

const validateRegister = validate({
  body: {
    name: { required: true, type: "string", minLength: 1, maxLength: 100, label: "Họ tên" },
    email: { required: true, type: "string", maxLength: 150, label: "Email" },
    password: { required: true, type: "string", minLength: 6, maxLength: 128, label: "Mật khẩu" },
  },
});

const validateChangePassword = validate({
  body: {
    currentPassword: { required: true, type: "string", maxLength: 128, label: "Mật khẩu hiện tại" },
    newPassword: { required: true, type: "string", minLength: 6, maxLength: 128, label: "Mật khẩu mới" },
  },
});

router.get("/csrf-token", issueCsrfToken);
router.post("/register", authRateLimiter, validateRegister, register);
router.post("/login", authRateLimiter, validateLogin, login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.put("/change-password", requireAuth, validateChangePassword, changePassword);

export default router;
