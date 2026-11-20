import jwt from "jsonwebtoken";
import { env } from "../config/env.mjs";
import { User, Salon } from "../models/index.mjs";
import { unauthorized, forbidden } from "../utils/HttpError.mjs";
import { isTokenRevoked } from "./security.mjs";

/**
 * Middleware bắt buộc xác thực — đọc Bearer token, verify JWT, kiểm tra thu hồi (logout), gắn req.user.
 */
export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw unauthorized("Token không được cung cấp.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (decoded.jti && isTokenRevoked(decoded.jti)) {
      throw unauthorized("Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.");
    }

    const user = await User.findOne({ id: decoded.userId }).select("+passwordHash");
    if (!user) throw unauthorized("Người dùng không tồn tại.");
    if (user.status === "locked") throw forbidden("Tài khoản đã bị khóa.");

    // Gắn user dạng plain object (không chứa passwordHash) và thông tin phiên JWT
    req.user = user.toJSON();
    req.auth = { jti: decoded.jti, exp: decoded.exp };
    next();
  } catch (err) {
    // Nếu jwt.verify ném lỗi (expired, invalid)
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(unauthorized("Token không hợp lệ hoặc đã hết hạn."));
    }
    next(err);
  }
}

/**
 * Middleware xác thực tùy chọn — nếu không có token thì req.user = null, vẫn next().
 */
export async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findOne({ id: decoded.userId }).select("+passwordHash");
    if (!user || user.status === "locked") {
      req.user = null;
      return next();
    }

    req.user = user.toJSON();
    next();
  } catch {
    // Token không hợp lệ → bỏ qua, coi như chưa đăng nhập
    req.user = null;
    next();
  }
}

/**
 * Middleware phân quyền — kiểm tra req.user.role nằm trong danh sách cho phép.
 * @param  {...string} roles  Danh sách role được phép (vd: 'admin', 'owner')
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden("Bạn không có quyền thực hiện thao tác này."));
    }
    next();
  };
}

/**
 * Middleware kiểm tra owner chỉ thao tác trên salon mình sở hữu (dựa theo Salon.ownerId).
 * Admin được phép truy cập bất kỳ salon nào.
 */
export async function requireSalonOwner(req, _res, next) {
  try {
    if (!req.user) return next(unauthorized());

    // Admin bypass
    if (req.user.role === "admin") return next();

    const salonId = Number(req.params.salonId || req.params.id || req.body.salonId);

    if (!salonId) {
      return next(forbidden("Không xác định được salon."));
    }

    const salon = await Salon.findOne({ id: salonId });
    if (!salon) {
      return next(forbidden("Không tìm thấy salon hoặc bạn không có quyền thao tác."));
    }

    if (salon.ownerId !== req.user.id && req.user.salonId !== salonId) {
      return next(forbidden("Bạn không có quyền thao tác trên salon này."));
    }

    next();
  } catch (err) {
    next(err);
  }
}
