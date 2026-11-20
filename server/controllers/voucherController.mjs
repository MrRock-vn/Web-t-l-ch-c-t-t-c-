import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { badRequest, notFound, conflict } from "../utils/HttpError.mjs";
import { Voucher } from "../models/index.mjs";
import { todayISO } from "../utils/date.mjs";

/**
 * Tính toán mức giảm hợp lệ từ 1 mã voucher ở server (dùng chung cho /validate và createBooking).
 */
export async function computeVoucherDiscount({ code, salonId, subtotal }) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return { voucher: null, discountAmount: 0 };

  const voucher = await Voucher.findOne({ code: normalized, active: true });
  if (!voucher) throw notFound(`Mã giảm giá "${normalized}" không tồn tại hoặc đã ngừng áp dụng.`);

  if (voucher.expiresAt < todayISO()) {
    throw badRequest(`Mã giảm giá "${normalized}" đã hết hạn.`);
  }
  if (voucher.usedCount >= voucher.maxUses) {
    throw badRequest(`Mã giảm giá "${normalized}" đã hết lượt sử dụng.`);
  }
  if (voucher.salonId !== null && voucher.salonId !== Number(salonId)) {
    throw badRequest(`Mã giảm giá "${normalized}" không áp dụng cho cơ sở salon này.`);
  }
  if (subtotal < voucher.minOrder) {
    throw badRequest(
      `Đơn tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}₫ mới áp dụng được mã "${normalized}".`
    );
  }

  let discountAmount = 0;
  if (voucher.discountType === "percent") {
    discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else {
    discountAmount = voucher.discountValue;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  return { voucher, discountAmount };
}

/** GET /vouchers — Danh sách voucher đang hoạt động */
export const getVouchers = asyncHandler(async (_req, res) => {
  const today = todayISO();
  const vouchers = await Voucher.find({
    active: true,
    expiresAt: { $gte: today },
  }).sort({ createdAt: -1 });
  res.json({ vouchers });
});

/** POST /vouchers/validate — Kiểm tra mã giảm giá và tính số tiền giảm ở server */
export const validateVoucher = asyncHandler(async (req, res) => {
  const { code, salonId, subtotal } = req.body;
  if (!code) throw badRequest("Vui lòng nhập mã giảm giá.");
  const numSub = Number(subtotal) || 0;

  const { voucher, discountAmount } = await computeVoucherDiscount({
    code,
    salonId,
    subtotal: numSub,
  });

  res.json({
    valid: true,
    voucher,
    discountAmount,
    finalPrice: Math.max(0, numSub - discountAmount),
  });
});

/** POST /vouchers — Admin / Owner tạo mã giảm giá mới */
export const createVoucher = asyncHandler(async (req, res) => {
  const { code, title, discountType, discountValue, maxDiscount, minOrder, maxUses, expiresAt, salonId } =
    req.body;
  if (!code || !discountType || !discountValue || !expiresAt) {
    throw badRequest("Vui lòng nhập đủ mã, loại giảm, giá trị và ngày hết hạn.");
  }

  const normalized = String(code).trim().toUpperCase();
  const exists = await Voucher.findOne({ code: normalized });
  if (exists) throw conflict("Mã giảm giá này đã tồn tại.");

  const voucher = await Voucher.create({
    code: normalized,
    title: title || `Ưu đãi ${normalized}`,
    discountType,
    discountValue: Number(discountValue),
    maxDiscount: Number(maxDiscount) || 0,
    minOrder: Number(minOrder) || 0,
    maxUses: Number(maxUses) || 100,
    expiresAt,
    salonId: req.user.role === "owner" ? req.user.salonId : salonId ?? null,
    active: true,
  });

  res.status(201).json({ voucher });
});

/** DELETE /vouchers/:code — Admin vô hiệu hóa / xóa mã giảm giá */
export const deleteVoucher = asyncHandler(async (req, res) => {
  const normalized = String(req.params.code || "").trim().toUpperCase();
  const deleted = await Voucher.findOneAndDelete({ code: normalized });
  if (!deleted) throw notFound("Không tìm thấy mã giảm giá.");
  res.json({ message: `Đã xóa mã giảm giá ${normalized}.` });
});
