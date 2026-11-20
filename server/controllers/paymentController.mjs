import crypto from "node:crypto";
import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { badRequest, notFound, forbidden, HttpError } from "../utils/HttpError.mjs";
import { Payment, Booking } from "../models/index.mjs";
import { env } from "../config/env.mjs";
import { vnDateTime } from "../utils/date.mjs";
import { encryptSensitive, timingSafeHexEqual } from "../utils/crypto.mjs";
import { safeRedirectPath } from "../middleware/security.mjs";
import { pushNotification } from "./notificationController.mjs";

function requireVnpSecret() {
  if (!env.VNP_HASH_SECRET) {
    throw new HttpError(500, "Chưa cấu hình VNP_HASH_SECRET trên máy chủ.");
  }
  return env.VNP_HASH_SECRET;
}

/**
 * Tạo chuỗi query đã sắp xếp theo thứ tự alphabet và ký HMAC-SHA512 chuẩn VNPay.
 */
export function buildVnpaySignedQuery(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const pairs = sortedKeys.map(
    (k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k])).replace(/%20/g, "+")}`
  );
  const signData = pairs.join("&");
  const secureHash = crypto.createHmac("sha512", secret).update(signData, "utf-8").digest("hex");
  return { signData, secureHash };
}

function formatVnpCreateDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value || "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

/**
 * GET /payments — Danh sách giao dịch (theo vai trò).
 */
export const getPayments = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { customerId: req.user.id };
  const payments = await Payment.find(filter).sort({ createdAt: -1 });
  res.json({ payments });
});

/**
 * POST /payments/vnpay/create
 * Tạo URL thanh toán VNPay có chữ ký HMAC-SHA512 và lưu Payment ở trạng thái pending.
 * Chỉ trả `simulateReturnUrl` khi bật cờ `VNP_SIMULATE=true` ở môi trường dev/demo (không bao giờ ở production).
 */
export const createVnpayUrl = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) throw badRequest("Thiếu mã lịch hẹn (bookingId).");

  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  if (booking.customerId !== req.user.id && req.user.role !== "admin") {
    throw forbidden("Bạn không có quyền thanh toán cho lịch hẹn này.");
  }
  if (booking.paymentStatus === "paid") {
    throw badRequest("Lịch hẹn này đã được thanh toán.");
  }
  if (booking.status === "cancelled") {
    throw badRequest("Không thể thanh toán cho lịch hẹn đã hủy.");
  }

  const secret = requireVnpSecret();
  const txnRef = `${booking.id}_${Date.now()}`;
  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.VNP_TMN_CODE || "BARBERSPA01",
    vnp_Amount: Math.round(booking.totalPrice * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan dat lich ${booking.id}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: env.VNP_RETURN_URL || "http://localhost:4000/api/payments/vnpay/return",
    vnp_IpAddr: req.ip || "127.0.0.1",
    vnp_CreateDate: formatVnpCreateDate(),
  };

  const { signData, secureHash } = buildVnpaySignedQuery(vnpParams, secret);
  const baseUrl = env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const paymentUrl = `${baseUrl}?${signData}&vnp_SecureHash=${secureHash}`;

  const payId = `PAY-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
  // Mã hóa chữ ký giao dịch bằng AES-256-GCM trước khi lưu vào MongoDB (OWASP #7)
  const payment = await Payment.create({
    id: payId,
    bookingId: booking.id,
    customerId: booking.customerId,
    amount: booking.totalPrice,
    method: "vnpay",
    vnpTxnRef: txnRef,
    vnpSignature: encryptSensitive(secureHash),
    status: "pending",
  });

  const responsePayload = {
    paymentUrl,
    payment,
    simulated: env.VNP_SIMULATE,
  };

  // Chỉ phát sinh URL mô phỏng callback khi bật cờ VNP_SIMULATE=true ở môi trường dev/demo
  if (env.VNP_SIMULATE) {
    const returnParams = {
      ...vnpParams,
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
    };
    const { signData: retSignData, secureHash: retHash } = buildVnpaySignedQuery(returnParams, secret);
    responsePayload.simulateReturnUrl = `/api/payments/vnpay/return?${retSignData}&vnp_SecureHash=${retHash}`;
  }

  res.status(201).json(responsePayload);
});

/**
 * GET /payments/vnpay/return
 * Xác minh chữ ký HMAC-SHA512, kiểm tra idempotent (chỉ xử lý pending) và đối chiếu số tiền.
 */
export const vnpayReturn = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const receivedHash = String(query.vnp_SecureHash || "");
  const requestedReturnTo = safeRedirectPath(query.returnTo, "/");
  delete query.vnp_SecureHash;
  delete query.vnp_SecureHashType;
  delete query.returnTo;

  const secret = requireVnpSecret();
  const { secureHash: expectedHash } = buildVnpaySignedQuery(query, secret);

  // So sánh chữ ký theo thời gian hằng số (timingSafeEqual) chống Timing Attack
  const isValidSignature = timingSafeHexEqual(receivedHash, expectedHash);

  const txnRef = String(query.vnp_TxnRef || "");
  const responseCode = String(query.vnp_ResponseCode || "");

  if (!isValidSignature) {
    if (req.headers.accept?.includes("application/json")) {
      throw badRequest("Chữ ký VNPay (HMAC-SHA512) không hợp lệ.");
    }
    return res.redirect(`${requestedReturnTo}?payment=invalid_signature`);
  }

  const payment = await Payment.findOne({ vnpTxnRef: txnRef });
  if (!payment) {
    if (req.headers.accept?.includes("application/json")) {
      throw notFound("Không tìm thấy giao dịch thanh toán.");
    }
    return res.redirect(`${requestedReturnTo}?payment=not_found`);
  }

  const booking = await Booking.findOne({ id: payment.bookingId });

  // Kiểm tra đối chiếu số tiền (vnp_Amount = VND * 100)
  if (Number(query.vnp_Amount) !== Math.round(payment.amount * 100)) {
    if (req.headers.accept?.includes("application/json")) {
      throw badRequest("Sai số tiền thanh toán so với đơn đặt lịch.");
    }
    return res.redirect(`${requestedReturnTo}?payment=invalid_amount`);
  }

  // Idempotent: nếu giao dịch đã được xử lý (paid / refunded / failed) -> trả kết quả hiện tại, KHÔNG ghi đè
  if (payment.status !== "pending") {
    if (req.headers.accept?.includes("application/json")) {
      return res.json({
        verified: true,
        alreadyProcessed: true,
        status: payment.status,
        payment,
        booking,
      });
    }
    return res.redirect(
      `${requestedReturnTo}?payment=${encodeURIComponent(payment.status)}&bookingId=${encodeURIComponent(payment.bookingId)}`
    );
  }

  if (responseCode === "00") {
    payment.status = "paid";
    payment.paidAt = new Date();
    await payment.save();

    if (booking) {
      booking.paymentMethod = "vnpay";
      booking.paymentStatus = "paid";
      if (booking.status === "pending") {
        booking.status = "confirmed";
      }
      await booking.save();
    }

    if (req.headers.accept?.includes("application/json")) {
      return res.json({ verified: true, status: "paid", payment, booking });
    }
    return res.redirect(
      `${requestedReturnTo}?payment=success&bookingId=${encodeURIComponent(payment.bookingId)}`
    );
  }

  payment.status = "failed";
  await payment.save();

  if (req.headers.accept?.includes("application/json")) {
    return res.status(400).json({ error: "Thanh toán VNPay thất bại.", responseCode });
  }
  return res.redirect(`${requestedReturnTo}?payment=failed&code=${encodeURIComponent(responseCode)}`);
});

/**
 * POST /payments/:bookingId/refund-request
 * Khách hàng yêu cầu hoàn tiền (áp dụng quy tắc trước 2 giờ nếu lịch chưa hủy).
 */
export const requestRefund = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.bookingId });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  if (booking.customerId !== req.user.id && req.user.role !== "admin") {
    throw forbidden("Bạn không có quyền yêu cầu hoàn tiền cho lịch hẹn này.");
  }
  if (booking.paymentStatus !== "paid") {
    throw badRequest("Chỉ có thể yêu cầu hoàn tiền cho lịch hẹn đã thanh toán.");
  }

  const appointmentDT = vnDateTime(booking.date, booking.time);
  const diffMs = appointmentDT.getTime() - Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  if (booking.status !== "cancelled" && diffMs < twoHoursMs) {
    throw badRequest("Không thể yêu cầu hoàn tiền trong vòng 2 giờ trước giờ hẹn.");
  }

  booking.paymentStatus = "refund_requested";
  booking.status = "cancelled";
  await booking.save();

  // Lấy đúng bản ghi giao dịch đã thanh toán gần nhất (không lấy nhầm bản ghi failed)
  let payment = await Payment.findOne({ bookingId: booking.id, status: "paid" }).sort({
    createdAt: -1,
  });
  if (payment) {
    payment.status = "refund_requested";
    await payment.save();
  } else {
    payment = await Payment.create({
      id: `PAY-${Date.now().toString(36).toUpperCase()}`,
      bookingId: booking.id,
      customerId: booking.customerId,
      amount: booking.totalPrice,
      method: booking.paymentMethod || "vnpay",
      status: "refund_requested",
    });
  }

  res.json({ booking, payment });
});

/**
 * PATCH /admin/payments/:bookingId/refund
 * Admin duyệt (approve) hoặc từ chối (reject) yêu cầu hoàn tiền.
 */
export const approveRefund = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.bookingId });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  if (booking.paymentStatus !== "refund_requested") {
    throw badRequest("Lịch hẹn này không có yêu cầu hoàn tiền đang chờ duyệt.");
  }

  const { action } = req.body;
  if (!["approve", "reject"].includes(action)) {
    throw badRequest("Hành động không hợp lệ (cho phép: approve, reject).");
  }

  const nextStatus = action === "approve" ? "refunded" : "paid";
  booking.paymentStatus = nextStatus;
  await booking.save();

  // Cập nhật đúng bản ghi thanh toán đang chờ hoàn tiền (refund_requested)
  const payment = await Payment.findOneAndUpdate(
    { bookingId: booking.id, status: "refund_requested" },
    { $set: { status: nextStatus } },
    { new: true, sort: { createdAt: -1 } }
  );

  await pushNotification({
    userId: booking.customerId,
    title: action === "approve" ? `Đã duyệt hoàn tiền ${booking.id}` : `Từ chối hoàn tiền ${booking.id}`,
    message:
      action === "approve"
        ? `Yêu cầu hoàn tiền ${booking.totalPrice.toLocaleString("vi-VN")}₫ cho lịch ${booking.id} đã được Quản trị viên phê duyệt.`
        : `Yêu cầu hoàn tiền cho lịch ${booking.id} không được chấp thuận.`,
    type: "payment",
  });

  res.json({ booking, payment });
});
