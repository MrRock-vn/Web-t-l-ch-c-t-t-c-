import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = mongoose.model("Counter", counterSchema);

/**
 * Cấp số nguyên tăng dần nguyên tử (atomic) bằng $inc của MongoDB,
 * tránh trùng ID khi nhiều request đồng thời và tránh lỗi sort chuỗi ("cat-9" > "cat-10").
 */
export async function nextSequence(name, minFloor = 0) {
  const existing = await Counter.findById(name);
  if (!existing) {
    try {
      await Counter.create({ _id: name, seq: minFloor });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  } else if (existing.seq < minFloor) {
    await Counter.updateOne({ _id: name, seq: { $lt: minFloor } }, { $set: { seq: minFloor } });
  }
  const updated = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return updated.seq;
}
