import mongoose from "mongoose";
import { schemaOptions } from "./_shared.mjs";

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: [true, "Vui lòng nhập tên danh mục."], trim: true },
    description: { type: String, default: "" },
  },
  schemaOptions({ timestamps: true })
);

export const Category = mongoose.model("Category", categorySchema);

