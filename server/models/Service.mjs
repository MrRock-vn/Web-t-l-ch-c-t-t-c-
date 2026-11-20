import mongoose from "mongoose";
import { schemaOptions } from "./_shared.mjs";

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    salonId: { type: Number, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
    name: { type: String, required: [true, "Vui lòng nhập tên dịch vụ."], trim: true },
    desc: { type: String, default: "" },
    price: { type: Number, required: true, min: [0, "Giá dịch vụ không được âm."] },
    duration: {
      type: Number,
      required: true,
      min: [5, "Thời lượng tối thiểu 5 phút."],
      max: [480, "Thời lượng tối đa 480 phút."],
    },
    active: { type: Boolean, default: true },
  },
  schemaOptions({ timestamps: true })
);

export const Service = mongoose.model("Service", serviceSchema);

