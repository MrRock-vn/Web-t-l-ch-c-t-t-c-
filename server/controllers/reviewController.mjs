import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { badRequest, notFound, forbidden, conflict } from "../utils/HttpError.mjs";
import { Review, Booking, Salon, Barber } from "../models/index.mjs";

/**
 * Tính lại điểm rating trung bình và số lượng đánh giá của salon & barber ở server.
 */
async function recalculateRatings(salonId, barberShortName) {
  const visibleSalonReviews = await Review.find({ salonId, hidden: { $ne: true } });
  const count = visibleSalonReviews.length;
  const avg =
    count > 0
      ? Math.round((visibleSalonReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

  await Salon.findOneAndUpdate({ id: salonId }, { $set: { rating: avg, reviews: count } });

  if (barberShortName) {
    const barberReviews = visibleSalonReviews.filter((r) => r.barber === barberShortName);
    if (barberReviews.length > 0) {
      const bAvg =
        Math.round((barberReviews.reduce((sum, r) => sum + r.rating, 0) / barberReviews.length) * 10) / 10;
      await Barber.findOneAndUpdate(
        { salonId, $or: [{ shortName: barberShortName }, { name: barberShortName }] },
        { $set: { rating: bAvg, reviews: barberReviews.length } }
      );
    }
  }
}

function formatVietnameseDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const d = parts.find((p) => p.type === "day")?.value || "1";
  const m = parts.find((p) => p.type === "month")?.value || "1";
  const y = parts.find((p) => p.type === "year")?.value || "2026";
  return `${d} tháng ${m}, ${y}`;
}

function makeAvatar(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "KH";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * GET /reviews?salonId=&barberId=
 */
export const getReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user || req.user.role !== "admin") {
    filter.hidden = { $ne: true };
  }
  if (req.query.salonId) {
    filter.salonId = Number(req.query.salonId);
  }
  if (req.query.barber) {
    filter.barber = req.query.barber;
  }

  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  res.json({ reviews });
});

/**
 * POST /reviews
 * Chỉ cho phép đánh giá khi: booking completed, đúng chủ lịch, chưa đánh giá, trong 30 ngày.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, text, photoUrl } = req.body;

  if (!bookingId) throw badRequest("Thiếu mã lịch hẹn (bookingId).");
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw badRequest("Số sao đánh giá phải từ 1 đến 5.");
  }
  if (!text || String(text).trim().length < 5) {
    throw badRequest("Nội dung đánh giá phải có ít nhất 5 ký tự.");
  }

  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  if (booking.customerId !== req.user.id) {
    throw forbidden("Bạn chỉ có thể đánh giá lịch hẹn của chính mình.");
  }
  if (booking.status !== "completed") {
    throw badRequest("Chỉ được đánh giá sau khi lịch hẹn đã hoàn thành.");
  }
  if (booking.reviewed) {
    throw conflict("Lịch hẹn này đã được đánh giá trước đó.");
  }

  // Kiểm tra trong vòng 30 ngày kể từ ngày hẹn (hoặc ngày tạo)
  const refDate = new Date(`${booking.date}T${booking.time}:00+07:00`);
  const diffDays = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) {
    throw badRequest("Đã quá thời hạn 30 ngày để đánh giá lịch hẹn này.");
  }

  const [salon, barber] = await Promise.all([
    Salon.findOne({ id: booking.salonId }),
    Barber.findOne({ id: booking.barberId }),
  ]);

  const id = `rev-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const barberShort = barber?.shortName || booking.barberName || "";
  const salonLabel = salon ? `${salon.name} - ${salon.district}` : booking.salonName;

  const review = await Review.create({
    id,
    bookingId: booking.id,
    customerId: req.user.id,
    name: req.user.name,
    date: formatVietnameseDate(),
    createdAt: new Date(),
    rating: numRating,
    text: String(text).trim(),
    photoUrl: photoUrl || "",
    service: booking.serviceNames,
    barber: barberShort,
    avatar: makeAvatar(req.user.name),
    salonId: booking.salonId,
    salon: salonLabel,
  });

  booking.reviewed = true;
  await booking.save();

  await recalculateRatings(booking.salonId, barberShort);

  res.status(201).json({ review });
});

/**
 * PUT /reviews/:id — Khách hàng sửa đánh giá của chính mình.
 */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ id: req.params.id });
  if (!review) throw notFound("Không tìm thấy đánh giá.");

  if (review.customerId !== req.user.id && req.user.role !== "admin") {
    throw forbidden("Bạn không có quyền sửa đánh giá này.");
  }

  if (req.body.rating !== undefined) {
    const r = Number(req.body.rating);
    if (r < 1 || r > 5) throw badRequest("Số sao phải từ 1 đến 5.");
    review.rating = r;
  }
  if (req.body.text !== undefined) {
    const t = String(req.body.text).trim();
    if (t.length < 5) throw badRequest("Nội dung đánh giá tối thiểu 5 ký tự.");
    review.text = t;
  }
  if (req.body.photoUrl !== undefined) {
    review.photoUrl = req.body.photoUrl;
  }

  await review.save();
  await recalculateRatings(review.salonId, review.barber);

  res.json({ review });
});

/**
 * POST /reviews/:id/reply — Chủ salon phản hồi đánh giá thuộc salon mình.
 */
export const replyReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ id: req.params.id });
  if (!review) throw notFound("Không tìm thấy đánh giá.");

  if (req.user.role === "owner") {
    const salon = await Salon.findOne({ id: review.salonId, ownerId: req.user.id });
    if (!salon) throw forbidden("Bạn chỉ có thể phản hồi đánh giá thuộc salon của mình.");
  }

  const replyText = String(req.body.reply || "").trim();
  if (!replyText) throw badRequest("Vui lòng nhập nội dung phản hồi.");

  review.ownerReply = replyText;
  await review.save();

  res.json({ review });
});

/**
 * POST /reviews/:id/report — Báo cáo đánh giá vi phạm.
 */
export const reportReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ id: req.params.id });
  if (!review) throw notFound("Không tìm thấy đánh giá.");

  const reason = String(req.body.reason || "Nội dung không phù hợp").trim();
  review.reported = true;
  review.reportReason = reason;
  await review.save();

  res.json({ review });
});

/**
 * PATCH /admin/reviews/:id — Admin kiểm duyệt đánh giá (keep | hide | delete).
 */
export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ id: req.params.id });
  if (!review) throw notFound("Không tìm thấy đánh giá.");

  const { action } = req.body;
  if (!["keep", "hide", "delete"].includes(action)) {
    throw badRequest("Hành động không hợp lệ (cho phép: keep, hide, delete).");
  }

  const { salonId, barber } = review;

  if (action === "delete") {
    await Review.deleteOne({ _id: review._id });
    await recalculateRatings(salonId, barber);
    return res.json({ message: "Đã xóa đánh giá.", id: review.id });
  }

  if (action === "hide") {
    review.hidden = true;
    review.reported = false;
  } else if (action === "keep") {
    review.hidden = false;
    review.reported = false;
    review.reportReason = "";
  }

  await review.save();
  await recalculateRatings(salonId, barber);

  res.json({ review });
});
