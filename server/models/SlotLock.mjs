import mongoose from "mongoose";

/**
 * Khóa phân tán nhẹ (SlotLock) theo `barberId:date` dùng unique index của MongoDB
 * để chống Race Condition khi 2 request có khung giờ chồng lấn (vd: 09:00 90p và 10:00 30p)
 * gửi vào cùng thời điểm. Tự hết hạn sau 30 giây nếu process gặp sự cố đột ngột.
 */
const slotLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 30 },
  },
  { versionKey: false }
);

export const SlotLock = mongoose.model("SlotLock", slotLockSchema);

export async function withBarberDateLock(barberId, date, fn) {
  const key = `${barberId}:${date}`;
  let acquired = false;

  for (let attempt = 0; attempt < 25; attempt++) {
    try {
      await SlotLock.create({ key });
      acquired = true;
      break;
    } catch (err) {
      if (err.code === 11000) {
        await new Promise((r) => setTimeout(r, 40));
        continue;
      }
      throw err;
    }
  }

  if (!acquired) {
    const err = new Error("Hệ thống đang xử lý lịch hẹn khác cho thợ này. Vui lòng thử lại sau giây lát.");
    err.status = 409;
    throw err;
  }

  try {
    return await fn();
  } finally {
    await SlotLock.deleteOne({ key }).catch(() => {});
  }
}
