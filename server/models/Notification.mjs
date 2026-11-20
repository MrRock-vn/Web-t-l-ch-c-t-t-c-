import mongoose from "mongoose";
import { schemaOptions } from "./_shared.mjs";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: Number, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["booking", "payment", "system"], default: "booking" },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  schemaOptions()
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
