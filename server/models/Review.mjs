import mongoose from "mongoose";
import { schemaOptions } from "./_shared.mjs";

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true, unique: true },
    customerId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    date: { type: String, default: "" }, // ngày hiển thị (vd: "12 tháng 10, 2026")
    createdAt: { type: Date, default: Date.now },
    rating: {
      type: Number,
      required: true,
      min: [1, "Số sao tối thiểu là 1."],
      max: [5, "Số sao tối đa là 5."],
    },
    text: { type: String, required: true, minlength: [5, "Nội dung đánh giá tối thiểu 5 ký tự."], maxlength: 1000 },
    photoUrl: { type: String, default: "" },
    service: { type: String, default: "" },
    barber: { type: String, default: "" },
    avatar: { type: String, default: "" },
    salonId: { type: Number, required: true, index: true },
    salon: { type: String, default: "" },
    ownerReply: { type: String, default: "" },
    reported: { type: Boolean, default: false },
    reportReason: { type: String, default: "" },
    hidden: { type: Boolean, default: false },
  },
  schemaOptions()
);

export const Review = mongoose.model("Review", reviewSchema);

