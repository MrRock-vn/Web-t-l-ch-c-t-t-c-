import mongoose from "mongoose";
import { HttpError } from "../utils/HttpError.mjs";

/** 404 cho các route /api không tồn tại */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Không tìm thấy API: ${req.method} ${req.originalUrl}` });
}

/** Trả mọi lỗi về một định dạng thống nhất: { error: "..." } */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // JSON body sai cú pháp
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Dữ liệu gửi lên không phải JSON hợp lệ." });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ error: first?.message || "Dữ liệu không hợp lệ." });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Giá trị không hợp lệ cho trường "${err.path}".` });
  }

  // Vi phạm unique index (vd: email trùng, trùng khung giờ của thợ)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    let message = "Dữ liệu bị trùng lặp.";
    if (fields.includes("email")) message = "Email đã được đăng ký trong hệ thống.";
    if (fields.includes("barberId") && fields.includes("time")) {
      message = "Khung giờ này của thợ vừa có khách khác đặt. Vui lòng chọn giờ khác!";
    }
    return res.status(409).json({ error: message });
  }

  console.error("[errorHandler]", err);
  return res.status(500).json({ error: "Lỗi máy chủ. Vui lòng thử lại sau." });
}

