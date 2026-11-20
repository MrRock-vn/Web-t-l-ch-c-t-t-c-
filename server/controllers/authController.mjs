import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.mjs";
import { User, Salon, nextSequence } from "../models/index.mjs";
import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { revokeToken } from "../middleware/security.mjs";
import { badRequest, unauthorized, forbidden, conflict } from "../utils/HttpError.mjs";

/** Tạo JWT token kèm jti (JWT ID) để hỗ trợ thu hồi phiên khi đăng xuất */
function signToken(userId) {
  return jwt.sign({ userId, jti: crypto.randomUUID() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * POST /register
 * Đăng ký tài khoản mới (customer hoặc owner).
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, address, birthDate, salonName, district } = req.body;

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    throw badRequest("Họ tên, email và mật khẩu phải là chuỗi ký tự hợp lệ.");
  }
  if (!name.trim() || !email.trim() || !password) {
    throw badRequest("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
  }
  if (password.length < 6 || password.length > 128) {
    throw badRequest("Mật khẩu phải có độ dài từ 6 đến 128 ký tự.");
  }

  // Chỉ cho phép customer hoặc owner, từ chối admin từ client
  if (role && !["customer", "owner"].includes(role)) {
    throw forbidden("Chỉ cho phép đăng ký vai trò khách hàng (customer) hoặc chủ salon (owner).");
  }
  const userRole = role === "owner" ? "owner" : "customer";
  const normalizedEmail = email.toLowerCase().trim();

  // Kiểm tra email đã tồn tại chưa
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw conflict("Email đã được sử dụng.");

  // Hash password
  const passwordHash = bcrypt.hashSync(password, env.BCRYPT_ROUNDS);

  // Cấp ID nguyên tử bằng Counter (tránh trùng khi nhiều request đồng thời)
  const lastUser = await User.findOne().sort("-id");
  const newId = await nextSequence("users", lastUser?.id ?? 0);

  // Tạo User trước để tránh để lại Salon mồ côi nếu User.create thất bại
  const user = await User.create({
    id: newId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: typeof phone === "string" ? phone.trim() : "",
    role: userRole,
    address: typeof address === "string" ? address.trim() : "",
    birthDate: typeof birthDate === "string" ? birthDate.trim() : "",
  });

  // Nếu owner -> tạo Salon mới, nếu lỗi thì rollback xóa User vừa tạo
  if (userRole === "owner") {
    try {
      const lastSalon = await Salon.findOne().sort("-id");
      const salonId = await nextSequence("salons", lastSalon?.id ?? 0);

      await Salon.create({
        id: salonId,
        name: (typeof salonName === "string" && salonName.trim()) || `Salon của ${name.trim()}`,
        district: (typeof district === "string" && district.trim()) || "Hoàn Kiếm",
        address: (typeof address === "string" && address.trim()) || "Hà Nội",
        phone: typeof phone === "string" ? phone.trim() : "",
        ownerId: newId,
      });

      user.salonId = salonId;
      await user.save();
    } catch (err) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      throw err;
    }
  }

  const token = signToken(user.id);

  res.status(201).json({ user, token });
});

/**
 * POST /login
 * Đăng nhập bằng email + password.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    throw badRequest("Vui lòng nhập email và mật khẩu hợp lệ.");
  }
  if (password.length > 128) {
    throw badRequest("Mật khẩu quá dài.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) throw unauthorized("Email hoặc mật khẩu không đúng.");

  if (user.status === "locked") {
    throw forbidden("Tài khoản đã bị khóa.");
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) throw unauthorized("Email hoặc mật khẩu không đúng.");

  const token = signToken(user.id);

  // toJSON sẽ ẩn passwordHash
  res.json({ user, token });
});

/**
 * GET /me
 * Lấy thông tin user hiện tại (đã gắn từ requireAuth).
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

/**
 * PUT /profile
 * Cập nhật hồ sơ cá nhân — chỉ cho phép sửa name, phone, address, birthDate.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "address", "birthDate"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw badRequest("Không có trường nào được cập nhật.");
  }

  const user = await User.findOneAndUpdate(
    { id: req.user.id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({ user });
});

/**
 * PUT /change-password
 * Đổi mật khẩu (yêu cầu xác minh mật khẩu hiện tại).
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    throw badRequest("Mật khẩu phải là chuỗi ký tự hợp lệ.");
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    throw badRequest("Mật khẩu mới phải có độ dài từ 6 đến 128 ký tự.");
  }
  if (currentPassword === newPassword) {
    throw badRequest("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
  }

  const user = await User.findOne({ id: req.user.id }).select("+passwordHash");
  if (!user) throw unauthorized("Người dùng không tồn tại.");

  const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw badRequest("Mật khẩu hiện tại không chính xác.");
  }

  user.passwordHash = bcrypt.hashSync(newPassword, env.BCRYPT_ROUNDS);
  await user.save();

  res.json({ message: "Đổi mật khẩu thành công." });
});

/**
 * POST /logout
 * Thu hồi JWT hiện tại (chống dùng lại token sau khi đăng xuất — OWASP #3).
 */
export const logout = asyncHandler(async (req, res) => {
  if (req.auth?.jti) {
    revokeToken(req.auth.jti, req.auth.exp);
  }
  res.json({ message: "Đã đăng xuất và thu hồi phiên làm việc thành công." });
});
