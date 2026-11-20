import mongoose from "mongoose";
import { schemaOptions, SALON_STATUS } from "./_shared.mjs";

const salonSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: [true, "Vui lòng nhập tên salon."], trim: true },
    district: { type: String, required: true, index: true },
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    description: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    priceFrom: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    open: { type: Boolean, default: true },
    status: { type: String, enum: SALON_STATUS, default: "active" },
    openHours: { type: String, default: "08:00 - 20:30" },
    photo: { type: String, default: "" },
    booked: { type: Number, default: 0 },
    ownerId: { type: Number, required: true, index: true },
  },
  schemaOptions({ timestamps: true })
);

export const Salon = mongoose.model("Salon", salonSchema);

