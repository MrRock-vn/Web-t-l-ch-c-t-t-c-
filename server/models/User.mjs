import mongoose from "mongoose";
import { schemaOptions, ROLES, USER_STATUS } from "./_shared.mjs";

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: [true, "Vui lòng nhập họ tên."], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không đúng định dạng."],
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: ROLES, required: true, default: "customer" },
    status: { type: String, enum: USER_STATUS, default: "active" },
    // Khách hàng
    address: { type: String, default: "" },
    birthDate: { type: String, default: "" },
    // Chủ salon
    salonId: { type: Number },
    // Admin
    title: { type: String },
  },
  schemaOptions({ timestamps: true })
);

export const User = mongoose.model("User", userSchema);

