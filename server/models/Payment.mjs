import mongoose from "mongoose";
import { schemaOptions, PAYMENT_METHODS, PAYMENT_RECORD_STATUS } from "./_shared.mjs";

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // PAY-xxxx
    bookingId: { type: String, required: true, index: true },
    customerId: { type: Number, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    vnpTxnRef: { type: String, default: "" },
    vnpSignature: { type: String, default: "" },
    status: { type: String, enum: PAYMENT_RECORD_STATUS, default: "pending" },
    paidAt: { type: Date },
  },
  schemaOptions({ timestamps: true })
);

export const Payment = mongoose.model("Payment", paymentSchema);

