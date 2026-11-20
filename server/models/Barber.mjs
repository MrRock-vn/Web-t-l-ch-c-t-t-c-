import mongoose from "mongoose";
import { schemaOptions, WEEKDAYS } from "./_shared.mjs";
import { TIME_PATTERN } from "../utils/date.mjs";

const barberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    salonId: { type: Number, required: true, index: true },
    name: { type: String, required: [true, "Vui lòng nhập tên nhân viên."], trim: true },
    shortName: { type: String, default: "" },
    title: { type: String, default: "" },
    salon: { type: String, default: "" },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    specialties: { type: [String], default: [] },
    photo: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    workStart: { type: String, default: "08:00", match: [TIME_PATTERN, "Giờ bắt đầu ca phải dạng HH:mm."] },
    workEnd: { type: String, default: "20:00", match: [TIME_PATTERN, "Giờ kết thúc ca phải dạng HH:mm."] },
    daysOff: {
      type: [{ type: String, enum: WEEKDAYS }],
      default: [],
    },
    active: { type: Boolean, default: true },
  },
  schemaOptions({ timestamps: true })
);

export const Barber = mongoose.model("Barber", barberSchema);

