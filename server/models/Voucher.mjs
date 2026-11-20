import mongoose from "mongoose";
import { schemaOptions } from "./_shared.mjs";
import { DATE_PATTERN } from "../utils/date.mjs";

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    maxDiscount: { type: Number, default: 0, min: 0 }, // 0 = không giới hạn (dùng cho percent)
    minOrder: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 100, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: String, required: true, match: [DATE_PATTERN, "Ngày hết hạn dạng YYYY-MM-DD."] },
    salonId: { type: Number, default: null }, // null = áp dụng toàn nền tảng
    active: { type: Boolean, default: true },
  },
  schemaOptions({ timestamps: true })
);

export const Voucher = mongoose.model("Voucher", voucherSchema);
