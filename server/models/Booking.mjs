import mongoose from "mongoose";
import { schemaOptions, BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from "./_shared.mjs";
import { DATE_PATTERN, TIME_PATTERN } from "../utils/date.mjs";

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // Mã đặt lịch BS-xxxxx
    customerId: { type: Number, required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    salonId: { type: Number, required: true, index: true },
    salonName: { type: String, default: "" },
    serviceIds: {
      type: [String],
      validate: [(v) => Array.isArray(v) && v.length > 0, "Vui lòng chọn ít nhất 1 dịch vụ."],
    },
    serviceNames: { type: String, default: "" },
    barberId: { type: String, required: true },
    barberName: { type: String, default: "" },
    date: { type: String, required: true, match: [DATE_PATTERN, "Ngày hẹn phải dạng YYYY-MM-DD."] },
    time: { type: String, required: true, match: [TIME_PATTERN, "Giờ hẹn phải dạng HH:mm."] },
    totalDuration: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    voucherCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "counter" },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: "unpaid" },
    status: { type: String, enum: BOOKING_STATUS, default: "pending" },
    note: { type: String, default: "", maxlength: 500 },
    reviewed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  schemaOptions()
);

// Lớp bảo vệ cuối chống đặt trùng (race condition): một thợ không thể có 2 lịch
// đang hoạt động cùng ngày + cùng giờ bắt đầu. Lịch đã hủy/hoàn thành không bị ràng buộc,
// nên khách khác vẫn đặt lại được khung giờ của lịch đã hủy.
bookingSchema.index(
  { barberId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);
bookingSchema.index({ barberId: 1, date: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);

