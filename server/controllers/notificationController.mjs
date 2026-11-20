import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { notFound } from "../utils/HttpError.mjs";
import { Notification } from "../models/index.mjs";

/**
 * Helper tạo thông báo trong ứng dụng cho 1 userId (an toàn, không làm hỏng luồng chính nếu lỗi).
 */
export async function pushNotification({ userId, title, message, type = "booking" }) {
  if (!userId) return null;
  try {
    const id = `noti-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
    return await Notification.create({
      id,
      userId: Number(userId),
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    });
  } catch {
    return null;
  }
}

/** GET /notifications — Lấy 20 thông báo mới nhất của user hiện tại */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20),
    Notification.countDocuments({ userId: req.user.id, read: false }),
  ]);
  res.json({ notifications, unreadCount });
});

/** PATCH /notifications/read-all — Đánh dấu đã đọc toàn bộ thông báo */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

/** PATCH /notifications/:id/read — Đánh dấu đã đọc 1 thông báo */
export const markOneRead = asyncHandler(async (req, res) => {
  const noti = await Notification.findOneAndUpdate(
    { id: req.params.id, userId: req.user.id },
    { $set: { read: true } },
    { new: true }
  );
  if (!noti) throw notFound("Không tìm thấy thông báo.");
  res.json({ notification: noti });
});
