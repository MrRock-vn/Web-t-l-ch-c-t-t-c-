import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { badRequest, notFound, forbidden } from "../utils/HttpError.mjs";
import { Booking, Service, Barber, Salon, Voucher, withBarberDateLock } from "../models/index.mjs";
import { computeVoucherDiscount } from "./voucherController.mjs";
import { pushNotification } from "./notificationController.mjs";
import { todayISO, toMinutes, fromMinutes, vnDateTime } from "../utils/date.mjs";
import { WEEKDAYS } from "../models/_shared.mjs";

// Máy trạng thái hợp lệ cho lịch hẹn
const ALLOWED_TRANSITIONS = {
  pending: ["confirmed"],
  confirmed: ["completed"],
  completed: [],
  cancelled: [],
};

// ────────────────────────────────────────────────────────────────
// GET /salons/:id/availability?barberId=&date=&duration=
// ────────────────────────────────────────────────────────────────
export const getAvailability = asyncHandler(async (req, res) => {
  const salonId = Number(req.params.id);
  const { barberId, date, duration: rawDur } = req.query;
  const duration = Number(rawDur) || 30;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw badRequest("Vui lòng chọn ngày hợp lệ (YYYY-MM-DD).");
  }
  if (date < todayISO()) {
    throw badRequest("Không thể xem lịch trống của ngày đã qua.");
  }

  let barbers;
  if (barberId && barberId !== "any") {
    const b = await Barber.findOne({ id: barberId, salonId, active: true });
    if (!b) throw notFound("Không tìm thấy thợ.");
    barbers = [b];
  } else {
    barbers = await Barber.find({ salonId, active: true });
  }

  const weekdayName = WEEKDAYS[vnDateTime(date, "12:00").getDay()];
  const today = todayISO();

  const nowVN =
    date === today
      ? (() => {
          const d = new Date();
          const hhmm = d.toLocaleTimeString("en-GB", {
            hour12: false,
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
          });
          return toMinutes(hhmm.replace(/^24/, "00"));
        })()
      : null;

  const result = [];

  for (const barber of barbers) {
    if (barber.daysOff.includes(weekdayName)) {
      result.push({
        barberId: barber.id,
        barberName: barber.name,
        date,
        dayOff: true,
        slots: [],
      });
      continue;
    }

    const workStart = toMinutes(barber.workStart);
    const workEnd = toMinutes(barber.workEnd);

    const activeBookings = await Booking.find({
      barberId: barber.id,
      date,
      status: { $in: ["pending", "confirmed"] },
    });

    const slots = [];
    for (let slotStart = workStart; slotStart <= workEnd - duration; slotStart += 30) {
      if (nowVN !== null && slotStart <= nowVN) continue;

      const hasOverlap = activeBookings.some((bk) => {
        const existingStart = toMinutes(bk.time);
        const existingEnd = existingStart + bk.totalDuration;
        return slotStart < existingEnd && existingStart < slotStart + duration;
      });

      if (!hasOverlap) {
        slots.push(fromMinutes(slotStart));
      }
    }

    result.push({
      barberId: barber.id,
      barberName: barber.name,
      date,
      dayOff: false,
      workStart: barber.workStart,
      workEnd: barber.workEnd,
      slots,
    });
  }

  res.json({ availability: result });
});

// ────────────────────────────────────────────────────────────────
// POST /bookings
// ────────────────────────────────────────────────────────────────
export const createBooking = asyncHandler(async (req, res) => {
  const { salonId, barberId, serviceIds, date, time, note, paymentMethod, voucherCode } = req.body;

  if (!date || !time) throw badRequest("Vui lòng chọn ngày và giờ hẹn.");
  const appointmentDT = vnDateTime(date, time);
  if (Number.isNaN(appointmentDT.getTime()) || appointmentDT <= new Date()) {
    throw badRequest("Không thể đặt lịch trong quá khứ.");
  }

  // Cho phép khách nhập số điện thoại từ form đặt lịch nếu hồ sơ tài khoản chưa lưu SĐT
  const customerPhone = String(req.body.customerPhone || req.user.phone || "").trim();
  if (!customerPhone) {
    throw badRequest("Vui lòng nhập số điện thoại liên hệ.");
  }
  const customerName = String(req.body.customerName || req.user.name || "").trim();

  const salon = await Salon.findOne({ id: Number(salonId) });
  if (!salon) throw notFound("Không tìm thấy salon.");
  if (salon.status !== "active" || !salon.open) {
    throw badRequest("Salon hiện không hoạt động.");
  }

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw badRequest("Vui lòng chọn ít nhất 1 dịch vụ.");
  }
  const uniqueServiceIds = [...new Set(serviceIds)];
  const services = await Service.find({
    id: { $in: uniqueServiceIds },
    salonId: salon.id,
    active: true,
  });
  if (services.length !== uniqueServiceIds.length) {
    throw badRequest("Một số dịch vụ không hợp lệ hoặc không thuộc salon này.");
  }

  const subtotal = services.reduce((s, sv) => s + sv.price, 0);
  const { voucher, discountAmount } = voucherCode
    ? await computeVoucherDiscount({ code: voucherCode, salonId: salon.id, subtotal })
    : { voucher: null, discountAmount: 0 };
  const totalPrice = Math.max(0, subtotal - discountAmount);
  const totalDuration = services.reduce((s, sv) => s + sv.duration, 0);
  const weekdayName = WEEKDAYS[vnDateTime(date, "12:00").getDay()];
  const slotStart = toMinutes(time);
  const slotEnd = slotStart + totalDuration;

  // Chọn danh sách ứng viên barber
  let candidates;
  if (barberId === "any") {
    candidates = await Barber.find({ salonId: salon.id, active: true });
    if (candidates.length === 0) {
      throw badRequest("Salon hiện chưa có nhân viên hoạt động.");
    }
  } else {
    const b = await Barber.findOne({ id: barberId, salonId: salon.id, active: true });
    if (!b) throw notFound("Không tìm thấy thợ hoặc thợ không thuộc salon này.");
    candidates = [b];
  }

  // Nếu chọn "any", ưu tiên thợ có ít lịch nhất trong ngày rồi khóa từng ứng viên để tránh race condition
  if (barberId === "any") {
    const validCandidates = candidates.filter(
      (b) =>
        !b.daysOff.includes(weekdayName) &&
        slotStart >= toMinutes(b.workStart) &&
        slotEnd <= toMinutes(b.workEnd)
    );
    if (validCandidates.length === 0) {
      throw badRequest("Không có thợ nào làm việc vào khung giờ này.");
    }

    const withCounts = await Promise.all(
      validCandidates.map(async (b) => ({
        barber: b,
        count: await Booking.countDocuments({
          barberId: b.id,
          date,
          status: { $in: ["pending", "confirmed"] },
        }),
      }))
    );
    withCounts.sort((a, b) => a.count - b.count);

    for (const { barber } of withCounts) {
      const created = await withBarberDateLock(barber.id, date, async () => {
        const existingBookings = await Booking.find({
          barberId: barber.id,
          date,
          status: { $in: ["pending", "confirmed"] },
        });
        const hasOverlap = existingBookings.some((bk) => {
          const es = toMinutes(bk.time);
          const ee = es + bk.totalDuration;
          return slotStart < ee && es < slotEnd;
        });
        if (hasOverlap) return null;

        let bookingId;
        let exists = true;
        while (exists) {
          bookingId = "BS-" + String(Math.floor(10000 + Math.random() * 90000));
          exists = await Booking.findOne({ id: bookingId });
        }

        return Booking.create({
          id: bookingId,
          customerId: req.user.id,
          customerName,
          customerPhone,
          salonId: salon.id,
          salonName: salon.name,
          serviceIds: uniqueServiceIds,
          serviceNames: services.map((s) => s.name).join(", "),
          barberId: barber.id,
          barberName: barber.name,
          date,
          time,
          totalDuration,
          totalPrice,
          voucherCode: voucher?.code || "",
          discountAmount,
          paymentMethod: paymentMethod || "counter",
          note: note || "",
        });
      });

      if (created) {
        if (voucher) {
          await Voucher.updateOne({ _id: voucher._id }, { $inc: { usedCount: 1 } });
        }
        await Promise.all([
          pushNotification({
            userId: salon.ownerId,
            title: `Lịch hẹn mới ${created.id}`,
            message: `${customerName} vừa đặt ${created.serviceNames} lúc ${time} ngày ${date} (thợ ${barber.shortName || barber.name}).`,
            type: "booking",
          }),
          pushNotification({
            userId: req.user.id,
            title: `Đặt lịch thành công (${created.id})`,
            message: `Lịch hẹn tại ${salon.name} lúc ${time} ngày ${date} đã được ghi nhận.`,
            type: "booking",
          }),
        ]);
        return res.status(201).json({ booking: created });
      }
    }

    throw badRequest("Không có thợ nào rảnh vào khung giờ này.");
  }

  // Trường hợp chọn 1 barber cụ thể
  const chosenBarber = candidates[0];
  if (chosenBarber.daysOff.includes(weekdayName)) {
    throw badRequest("Thợ nghỉ vào ngày này.");
  }
  if (slotStart < toMinutes(chosenBarber.workStart) || slotEnd > toMinutes(chosenBarber.workEnd)) {
    throw badRequest("Giờ hẹn ngoài khung giờ làm việc của thợ.");
  }

  // Khóa theo barberId+date để chống race condition cả khi chồng lấn thời lượng (vd 09:00 90p vs 10:00 30p)
  const booking = await withBarberDateLock(chosenBarber.id, date, async () => {
    const existingBookings = await Booking.find({
      barberId: chosenBarber.id,
      date,
      status: { $in: ["pending", "confirmed"] },
    });
    const hasOverlap = existingBookings.some((bk) => {
      const es = toMinutes(bk.time);
      const ee = es + bk.totalDuration;
      return slotStart < ee && es < slotEnd;
    });
    if (hasOverlap) {
      throw badRequest("Khung giờ này đã có lịch hẹn khác.");
    }

    let bookingId;
    let exists = true;
    while (exists) {
      bookingId = "BS-" + String(Math.floor(10000 + Math.random() * 90000));
      exists = await Booking.findOne({ id: bookingId });
    }

    return Booking.create({
      id: bookingId,
      customerId: req.user.id,
      customerName,
      customerPhone,
      salonId: salon.id,
      salonName: salon.name,
      serviceIds: uniqueServiceIds,
      serviceNames: services.map((s) => s.name).join(", "),
      barberId: chosenBarber.id,
      barberName: chosenBarber.name,
      date,
      time,
      totalDuration,
      totalPrice,
      voucherCode: voucher?.code || "",
      discountAmount,
      paymentMethod: paymentMethod || "counter",
      note: note || "",
    });
  });

  if (voucher) {
    await Voucher.updateOne({ _id: voucher._id }, { $inc: { usedCount: 1 } });
  }
  await Promise.all([
    pushNotification({
      userId: salon.ownerId,
      title: `Lịch hẹn mới ${booking.id}`,
      message: `${customerName} vừa đặt ${booking.serviceNames} lúc ${time} ngày ${date} (thợ ${chosenBarber.shortName || chosenBarber.name}).`,
      type: "booking",
    }),
    pushNotification({
      userId: req.user.id,
      title: `Đặt lịch thành công (${booking.id})`,
      message: `Lịch hẹn tại ${salon.name} lúc ${time} ngày ${date} đã được ghi nhận.`,
      type: "booking",
    }),
  ]);

  res.status(201).json({ booking });
});

// ────────────────────────────────────────────────────────────────
// GET /bookings/mine
// ────────────────────────────────────────────────────────────────
export const getMyBookings = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === "admin") {
    filter = {};
  } else if (req.user.role === "owner") {
    const salons = await Salon.find({ ownerId: req.user.id });
    const salonIds = salons.map((s) => s.id);
    filter = { salonId: { $in: salonIds } };
  } else {
    filter = { customerId: req.user.id };
  }

  const bookings = await Booking.find(filter).sort({ createdAt: -1 });
  res.json({ bookings });
});

// ────────────────────────────────────────────────────────────────
// PATCH /bookings/:id/status  (Máy trạng thái: pending -> confirmed -> completed)
// ────────────────────────────────────────────────────────────────
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  if (req.user.role === "owner") {
    const salon = await Salon.findOne({ id: booking.salonId, ownerId: req.user.id });
    if (!salon) throw forbidden("Bạn không có quyền cập nhật lịch hẹn này.");
  }

  const { status } = req.body;
  const nextAllowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!nextAllowed.includes(status)) {
    throw badRequest(
      `Không thể chuyển trạng thái lịch hẹn từ "${booking.status}" sang "${status}". ` +
        "Chỉ cho phép quy trình: pending → confirmed → completed."
    );
  }

  // Chỉ được đánh dấu hoàn thành khi đã tới hoặc qua thời điểm hẹn
  if (status === "completed") {
    const appointmentDT = vnDateTime(booking.date, booking.time);
    if (appointmentDT > new Date()) {
      throw badRequest("Không thể đánh dấu hoàn thành cho lịch hẹn chưa tới giờ diễn ra.");
    }
    if (booking.paymentStatus === "unpaid") {
      booking.paymentStatus = "paid";
    }
  }

  booking.status = status;
  await booking.save();

  await pushNotification({
    userId: booking.customerId,
    title: status === "confirmed" ? `Lịch ${booking.id} đã xác nhận` : `Lịch ${booking.id} đã hoàn thành`,
    message:
      status === "confirmed"
        ? `${booking.salonName} đã xác nhận lịch hẹn lúc ${booking.time} ngày ${booking.date}.`
        : `Cảm ơn bạn đã sử dụng dịch vụ tại ${booking.salonName}. Hãy để lại đánh giá nhé!`,
    type: "booking",
  });

  res.json({ booking });
});

// ────────────────────────────────────────────────────────────────
// POST /bookings/:id/cancel
// ────────────────────────────────────────────────────────────────
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  const isCustomer = booking.customerId === req.user.id;
  let isOwner = false;
  if (req.user.role === "owner") {
    const salon = await Salon.findOne({ id: booking.salonId, ownerId: req.user.id });
    isOwner = !!salon;
  }
  if (req.user.role === "admin") isOwner = true;

  if (!isCustomer && !isOwner) {
    throw forbidden("Bạn không có quyền hủy lịch hẹn này.");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw badRequest(`Không thể hủy lịch hẹn đang ở trạng thái "${booking.status}".`);
  }

  // Rule 2 giờ: nếu thời điểm hẹn - now < 2 giờ → không cho hủy
  const appointmentDT = vnDateTime(booking.date, booking.time);
  const diffMs = appointmentDT.getTime() - Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  if (diffMs < twoHoursMs) {
    throw badRequest("Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ hẹn.");
  }

  booking.status = "cancelled";
  await booking.save();

  const salon = await Salon.findOne({ id: booking.salonId });
  if (salon) {
    await pushNotification({
      userId: salon.ownerId,
      title: `Khách đã hủy lịch ${booking.id}`,
      message: `Lịch lúc ${booking.time} ngày ${booking.date} của ${booking.customerName} đã bị hủy.`,
      type: "booking",
    });
  }

  res.json({ booking });
});

// ────────────────────────────────────────────────────────────────
// PATCH /bookings/:id/reschedule  (Chỉ cho phép khi pending hoặc confirmed)
// ────────────────────────────────────────────────────────────────
export const rescheduleBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) throw notFound("Không tìm thấy lịch hẹn.");

  if (booking.customerId !== req.user.id && req.user.role !== "admin") {
    throw forbidden("Bạn không có quyền đổi lịch hẹn này.");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw badRequest("Chỉ có thể đổi lịch cho các lịch hẹn đang chờ xác nhận hoặc đã xác nhận.");
  }

  const { date, time } = req.body;
  if (!date || !time) throw badRequest("Vui lòng chọn ngày và giờ mới.");

  const newDT = vnDateTime(date, time);
  if (Number.isNaN(newDT.getTime()) || newDT <= new Date()) {
    throw badRequest("Không thể đổi sang lịch trong quá khứ.");
  }

  const salon = await Salon.findOne({ id: booking.salonId });
  if (!salon || salon.status !== "active" || !salon.open) {
    throw badRequest("Salon hiện không hoạt động.");
  }

  const barber = await Barber.findOne({ id: booking.barberId, active: true });
  if (!barber) throw badRequest("Thợ không còn hoạt động.");

  const weekdayName = WEEKDAYS[vnDateTime(date, "12:00").getDay()];
  if (barber.daysOff.includes(weekdayName)) {
    throw badRequest("Thợ nghỉ vào ngày này.");
  }

  const slotStart = toMinutes(time);
  const slotEnd = slotStart + booking.totalDuration;
  if (slotStart < toMinutes(barber.workStart) || slotEnd > toMinutes(barber.workEnd)) {
    throw badRequest("Giờ hẹn ngoài khung giờ làm việc của thợ.");
  }

  const updated = await withBarberDateLock(booking.barberId, date, async () => {
    const existingBookings = await Booking.find({
      barberId: booking.barberId,
      date,
      status: { $in: ["pending", "confirmed"] },
      id: { $ne: booking.id },
    });
    const hasOverlap = existingBookings.some((bk) => {
      const es = toMinutes(bk.time);
      const ee = es + bk.totalDuration;
      return slotStart < ee && es < slotEnd;
    });
    if (hasOverlap) {
      throw badRequest("Khung giờ mới đã có lịch hẹn khác.");
    }

    booking.date = date;
    booking.time = time;
    await booking.save();
    return booking;
  });

  res.json({ booking: updated });
});
