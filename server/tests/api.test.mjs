import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// Buộc dùng MongoDB in-memory khi chạy bộ test tự động để cô lập hoàn toàn dữ liệu
process.env.USE_MEMORY_DB = "1";

import { app, connectDB } from "../app.mjs";
import { disconnectDB } from "../config/db.mjs";
import { seedDatabase } from "../seed.mjs";
import { Booking, Salon, Barber, Payment } from "../models/index.mjs";
import { todayISO, addDaysISO, vnDateTime } from "../utils/date.mjs";
import { WEEKDAYS } from "../models/_shared.mjs";

/**
 * Tìm một ngày tương lai (từ +2 ngày trở đi) mà ngày đó KHÔNG rơi vào các thứ trong `avoidWeekdays`.
 */
function pickFutureDate(avoidWeekdays = []) {
  const base = todayISO();
  for (let offset = 2; offset <= 14; offset++) {
    const candidate = addDaysISO(base, offset);
    const wd = WEEKDAYS[vnDateTime(candidate, "12:00").getDay()];
    if (!avoidWeekdays.includes(wd)) return candidate;
  }
  return addDaysISO(base, 3);
}

/**
 * Tìm một ngày tương lai rơi đúng vào `targetWeekday` (vd: "Thứ Hai").
 */
function pickFutureWeekday(targetWeekday) {
  const base = todayISO();
  for (let offset = 1; offset <= 14; offset++) {
    const candidate = addDaysISO(base, offset);
    const wd = WEEKDAYS[vnDateTime(candidate, "12:00").getDay()];
    if (wd === targetWeekday) return candidate;
  }
  return addDaysISO(base, 3);
}

let customerToken = "";
let owner1Token = "";
let owner2Token = "";
let adminToken = "";
let createdBookingId = "";

test.before(async () => {
  await connectDB({ autoSeed: false });
  await seedDatabase();

  // Lấy token của các vai trò từ seed
  const [custRes, own1Res, own2Res, admRes] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "khachhang@barberspa.vn", password: "123456" }),
    request(app).post("/api/auth/login").send({ email: "owner@barberspa.vn", password: "owner123" }),
    request(app).post("/api/auth/login").send({ email: "gentscut@barberspa.vn", password: "owner123" }),
    request(app).post("/api/auth/login").send({ email: "admin@barberspa.vn", password: "admin123" }),
  ]);

  assert.equal(custRes.status, 200);
  assert.equal(own1Res.status, 200);
  assert.equal(own2Res.status, 200);
  assert.equal(admRes.status, 200);

  customerToken = custRes.body.token;
  owner1Token = own1Res.body.token;
  owner2Token = own2Res.body.token;
  adminToken = admRes.body.token;
});

test.after(async () => {
  await disconnectDB();
});

// ============================================================================
// TC01: Đăng ký, Đăng nhập JWT & Chặn đăng ký role admin từ client
// ============================================================================
test("TC01: Đăng ký customer, đăng nhập JWT, lấy /me và chặn đăng ký role admin", async () => {
  // 1. Chặn đăng ký role admin từ client
  const adminAttempt = await request(app).post("/api/auth/register").send({
    name: "Hacker Admin",
    email: "hacker@barberspa.vn",
    password: "password123",
    role: "admin",
  });
  assert.equal(adminAttempt.status, 403);
  assert.ok(adminAttempt.body.error);

  // 2. Đăng ký khách hàng hợp lệ
  const regRes = await request(app).post("/api/auth/register").send({
    name: "Nguyễn Văn An",
    email: "nguyenvanan@barberspa.vn",
    phone: "0911223344",
    password: "password123",
    role: "customer",
  });
  assert.equal(regRes.status, 201);
  assert.ok(regRes.body.token);
  assert.equal(regRes.body.user.role, "customer");
  assert.equal(regRes.body.user.passwordHash, undefined);

  // 3. Gọi GET /api/auth/me bằng JWT vừa cấp
  const meRes = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${regRes.body.token}`);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.user.email, "nguyenvanan@barberspa.vn");

  // 4. Đăng nhập sai mật khẩu -> 401
  const wrongPw = await request(app).post("/api/auth/login").send({
    email: "nguyenvanan@barberspa.vn",
    password: "sai_mat_khau",
  });
  assert.equal(wrongPw.status, 401);
});

// ============================================================================
// TC02: Tìm kiếm & lọc danh sách Salon theo quận + xem dịch vụ/thợ
// ============================================================================
test("TC02: Lấy danh sách Salon theo quận và kiểm tra dữ liệu dịch vụ/thợ nhất quán", async () => {
  const allRes = await request(app).get("/api/salons");
  assert.equal(allRes.status, 200);
  assert.ok(allRes.body.salons.length >= 6);

  const hkRes = await request(app).get("/api/salons?district=" + encodeURIComponent("Hoàn Kiếm"));
  assert.equal(hkRes.status, 200);
  assert.ok(hkRes.body.salons.length >= 1);
  assert.ok(hkRes.body.salons.every((s) => s.district === "Hoàn Kiếm"));

  const svcRes = await request(app).get("/api/services?salonId=2");
  assert.equal(svcRes.status, 200);
  assert.ok(svcRes.body.services.length >= 3);
});

// ============================================================================
// TC03: Đặt lịch thành công (server tự tính giá & thời lượng, sinh mã BS-xxxxx)
// ============================================================================
test("TC03: Đặt lịch hợp lệ, server tự tính totalPrice/totalDuration và chọn 'any' barber", async () => {
  const workDate = pickFutureDate(["Thứ Hai", "Thứ Tư"]);

  // Kiểm tra API khung giờ trống
  const availRes = await request(app).get(
    `/api/salons/1/availability?barberId=khoi&date=${workDate}&duration=75`
  );
  assert.equal(availRes.status, 200);
  assert.ok(availRes.body.availability.length === 1);
  assert.ok(availRes.body.availability[0].slots.includes("10:00"));

  // Đặt lịch với barberId="khoi", gửi giá giả totalPrice=1 để xác minh server bỏ qua giá client
  const bkRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cat-toc", "cao-rau"], // 80k (45p) + 60k (30p) = 140k (75p)
      date: workDate,
      time: "10:00",
      totalPrice: 1,
      paymentMethod: "counter",
      note: "Test TC03",
    });

  assert.equal(bkRes.status, 201);
  assert.match(bkRes.body.booking.id, /^BS-\d{5}$/);
  assert.equal(bkRes.body.booking.totalPrice, 140000);
  assert.equal(bkRes.body.booking.totalDuration, 75);
  createdBookingId = bkRes.body.booking.id;

  // Đặt lịch với barberId="any" -> server tự gán thợ rảnh tại salon 1 (nam-phong)
  const anyRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "any",
      serviceIds: ["cat-toc"],
      date: workDate,
      time: "10:00",
      paymentMethod: "counter",
    });
  assert.equal(anyRes.status, 201);
  assert.equal(anyRes.body.booking.barberId, "nam-phong");
});

// ============================================================================
// TC04 + Extra 1: Chống đặt trùng giờ & đặt chồng thời lượng (duration overlap)
// ============================================================================
test("TC04 & Extra 1: Từ chối đặt trùng khung giờ và đặt chồng lấn thời lượng", async () => {
  const workDate = pickFutureDate(["Thứ Hai", "Thứ Tư"]);

  // Trùng chính xác 10:00 của thợ khoi (đã đặt ở TC03, kéo dài 10:00 -> 11:15)
  const exactDup = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cat-toc"],
      date: workDate,
      time: "10:00",
    });
  assert.equal(exactDup.status, 400);

  // Chồng thời lượng: 10:30 nằm trong [10:00, 11:15)
  const overlapAfter = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cao-rau"],
      date: workDate,
      time: "10:30",
    });
  assert.equal(overlapAfter.status, 400);

  // Chồng thời lượng ngược: 09:30 với dịch vụ 45p -> [09:30, 10:15) đè lên 10:00
  const overlapBefore = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cat-toc"],
      date: workDate,
      time: "09:30",
    });
  assert.equal(overlapBefore.status, 400);

  // Đặt sát giờ sau khi xong (11:30) -> hợp lệ!
  const validAfter = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cao-rau"],
      date: workDate,
      time: "11:30",
    });
  assert.equal(validAfter.status, 201);
});

// ============================================================================
// Extra 2: Đặt ngoài giờ làm việc & vào ngày nghỉ của thợ (daysOff)
// ============================================================================
test("Extra 2: Từ chối đặt lịch ngoài giờ làm việc và vào ngày nghỉ của thợ", async () => {
  const workDate = pickFutureDate(["Thứ Hai"]);
  // Thợ khoi làm 08:00 - 20:00. Đặt 19:30 với dịch vụ 45p -> kết thúc 20:15 > 20:00
  const outsideHours = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cat-toc"],
      date: workDate,
      time: "19:30",
    });
  assert.equal(outsideHours.status, 400);

  // Thợ khoi nghỉ Thứ Hai
  const mondayDate = pickFutureWeekday("Thứ Hai");
  const onDayOff = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cat-toc"],
      date: mondayDate,
      time: "10:00",
    });
  assert.equal(onDayOff.status, 400);
});

// ============================================================================
// TC05: Đổi lịch (reschedule) & Hủy lịch (quy tắc 2 giờ)
// ============================================================================
test("TC05: Đổi lịch hợp lệ và quy tắc hủy lịch trước 2 giờ", async () => {
  const newDate = pickFutureDate(["Thứ Hai", "Thứ Tư"]);

  // Đổi lịch booking vừa tạo ở TC03 sang 14:00
  const resched = await request(app)
    .patch(`/api/bookings/${createdBookingId}/reschedule`)
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ date: newDate, time: "14:00" });
  assert.equal(resched.status, 200);
  assert.equal(resched.body.booking.time, "14:00");

  // Hủy lịch tương lai (> 2 giờ) -> thành công
  const cancelOk = await request(app)
    .post(`/api/bookings/${createdBookingId}/cancel`)
    .set("Authorization", `Bearer ${customerToken}`);
  assert.equal(cancelOk.status, 200);
  assert.equal(cancelOk.body.booking.status, "cancelled");

  // Tạo 1 booking sắp diễn ra trong 30 phút tới (trực tiếp trong DB) để test rule < 2 giờ
  const soon = new Date(Date.now() + 30 * 60 * 1000);
  const soonDate = todayISO(soon);
  const soonTime = soon
    .toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/^24/, "00");

  await Booking.create({
    id: "BS-99901",
    customerId: 4,
    customerName: "Hoàng Minh Tuấn",
    customerPhone: "0987654321",
    salonId: 1,
    salonName: "Barber 36",
    serviceIds: ["cao-rau"],
    serviceNames: "Cạo râu",
    barberId: "nam-phong",
    barberName: "Vũ Nam Phong",
    date: soonDate,
    time: soonTime,
    totalDuration: 30,
    totalPrice: 60000,
    paymentMethod: "counter",
    paymentStatus: "unpaid",
    status: "confirmed",
  });

  const cancelBlocked = await request(app)
    .post("/api/bookings/BS-99901/cancel")
    .set("Authorization", `Bearer ${customerToken}`);
  assert.equal(cancelBlocked.status, 400);
});

// ============================================================================
// TC06: Thanh toán VNPay (tạo URL ký HMAC-SHA512, xác minh chữ ký) & Hoàn tiền
// ============================================================================
test("TC06: Tạo URL VNPay ký HMAC-SHA512, xác minh chữ ký hợp lệ/giả mạo & hoàn tiền", async () => {
  const workDate = pickFutureDate(["Thứ Hai", "Thứ Tư"]);
  const bkRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "khoi",
      serviceIds: ["cat-toc"],
      date: workDate,
      time: "15:00",
      paymentMethod: "vnpay",
    });
  assert.equal(bkRes.status, 201);
  const payBookingId = bkRes.body.booking.id;

  // 1. Tạo URL VNPay có chữ ký HMAC-SHA512
  const createPay = await request(app)
    .post("/api/payments/vnpay/create")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ bookingId: payBookingId });
  assert.equal(createPay.status, 201);
  assert.ok(createPay.body.paymentUrl.includes("vnp_SecureHash="));
  assert.ok(createPay.body.simulateReturnUrl.includes("/api/payments/vnpay/return"));

  // 2. Giả mạo chữ ký trên callback -> phải bị từ chối 400
  const tamperedUrl = createPay.body.simulateReturnUrl.replace(/vnp_SecureHash=[a-f0-9]+/i, "vnp_SecureHash=DEADBEAF0000");
  const badReturn = await request(app).get(tamperedUrl).set("Accept", "application/json");
  assert.equal(badReturn.status, 400);

  // 3. Callback với chữ ký HMAC-SHA512 hợp lệ -> cập nhật paid & confirmed
  const goodReturn = await request(app)
    .get(createPay.body.simulateReturnUrl)
    .set("Accept", "application/json");
  assert.equal(goodReturn.status, 200);
  assert.equal(goodReturn.body.verified, true);
  assert.equal(goodReturn.body.booking.paymentStatus, "paid");

  // 3b. Xác minh vnpSignature được mã hóa AES-256-GCM thật khi lưu trong DB
  const savedPay = await Payment.findOne({ bookingId: payBookingId });
  assert.ok(savedPay.vnpSignature.startsWith("enc:v1:"));

  // 3c. Sai số tiền vnp_Amount -> bị từ chối 400
  const badAmtUrl = createPay.body.simulateReturnUrl.replace(/vnp_Amount=\d+/, "vnp_Amount=100");
  const badAmtRes = await request(app).get(badAmtUrl).set("Accept", "application/json");
  assert.equal(badAmtRes.status, 400);

  // 4. Khách gửi yêu cầu hoàn tiền -> Admin duyệt hoàn tiền
  const refundReq = await request(app)
    .post(`/api/payments/${payBookingId}/refund-request`)
    .set("Authorization", `Bearer ${customerToken}`);
  assert.equal(refundReq.status, 200);
  assert.equal(refundReq.body.booking.paymentStatus, "refund_requested");

  const refundApprove = await request(app)
    .patch(`/api/admin/payments/${payBookingId}/refund`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ action: "approve" });
  assert.equal(refundApprove.status, 200);
  assert.equal(refundApprove.body.booking.paymentStatus, "refunded");

  // 5. Chống Replay URL VNPay cũ: gọi lại callback đã thành công không được ghi đè refunded về paid
  const replayRes = await request(app)
    .get(createPay.body.simulateReturnUrl)
    .set("Accept", "application/json");
  assert.equal(replayRes.status, 200);
  assert.equal(replayRes.body.alreadyProcessed, true);
  assert.equal(replayRes.body.status, "refunded");
  const bkAfterReplay = await Booking.findOne({ id: payBookingId });
  assert.equal(bkAfterReplay.paymentStatus, "refunded");
});

// ============================================================================
// TC07: Đánh giá sau hoàn thành + Chủ salon phản hồi + Tính lại rating ở server
// ============================================================================
test("TC07: Tạo đánh giá cho booking completed trong 30 ngày, phản hồi & tính lại rating", async () => {
  // Tạo 1 booking completed gần đây (hôm nay) để đảm bảo trong vòng 30 ngày
  const recentBookingId = "BS-88801";
  await Booking.create({
    id: recentBookingId,
    customerId: 4,
    customerName: "Hoàng Minh Tuấn",
    customerPhone: "0987654321",
    salonId: 1,
    salonName: "Barber 36",
    serviceIds: ["cat-toc"],
    serviceNames: "Cắt tóc",
    barberId: "khoi",
    barberName: "Nguyễn Minh Khôi",
    date: todayISO(),
    time: "08:00",
    totalDuration: 45,
    totalPrice: 80000,
    paymentMethod: "counter",
    paymentStatus: "paid",
    status: "completed",
    reviewed: false,
  });

  // 1. Gửi đánh giá hợp lệ
  const revRes = await request(app)
    .post("/api/reviews")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      bookingId: recentBookingId,
      rating: 4,
      text: "Cắt tóc rất đẹp và phục vụ chu đáo!",
    });
  assert.equal(revRes.status, 201);
  const reviewId = revRes.body.review.id;

  // 2. Gửi đánh giá lần 2 cho cùng booking -> bị từ chối 409
  const dupRev = await request(app)
    .post("/api/reviews")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      bookingId: recentBookingId,
      rating: 5,
      text: "Đánh giá trùng lần hai",
    });
  assert.equal(dupRev.status, 409);

  // 3. Chủ salon 1 phản hồi đánh giá
  const replyRes = await request(app)
    .post(`/api/reviews/${reviewId}/reply`)
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ reply: "Cảm ơn quý khách đã ủng hộ Barber 36!" });
  assert.equal(replyRes.status, 200);
  assert.equal(replyRes.body.review.ownerReply, "Cảm ơn quý khách đã ủng hộ Barber 36!");

  // 4. Xác minh server đã tính lại rating salon 1 (2 review 5 sao + 1 review 4 sao = 4.7)
  const salon1 = await Salon.findOne({ id: 1 });
  assert.equal(salon1.reviews, 3);
  assert.equal(salon1.rating, 4.7);
});

// ============================================================================
// TC08: Quy tắc quản trị Owner & Admin (xóa dịch vụ đang có lịch, xóa danh mục đang dùng, tự khóa mình)
// ============================================================================
test("TC08: Ràng buộc quản trị Owner & Admin", async () => {
  // 1. Từ chối xóa dịch vụ đang có lịch confirmed/pending (cat-toc ở salon 1)
  const delSvc = await request(app)
    .delete("/api/services/cat-toc")
    .set("Authorization", `Bearer ${owner1Token}`);
  assert.equal(delSvc.status, 409);

  // 2. Từ chối xóa danh mục còn dịch vụ đang dùng (cat-1)
  const delCat = await request(app)
    .delete("/api/admin/categories/cat-1")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(delCat.status, 409);

  // 3. Admin không thể tự khóa chính mình (id = 1)
  const selfLock = await request(app)
    .patch("/api/admin/users/1/lock")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ locked: true });
  assert.equal(selfLock.status, 400);
});

// ============================================================================
// Extra 3: Chủ Salon A sửa dữ liệu Salon B -> 403 Forbidden
// ============================================================================
test("Extra 3: Chủ Salon A (owner1) không được sửa thông tin hoặc dịch vụ của Salon B (salon 2)", async () => {
  const editOtherSalon = await request(app)
    .put("/api/salons/2")
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ name: "Bị chiếm quyền" });
  assert.equal(editOtherSalon.status, 403);

  const editOtherService = await request(app)
    .put("/api/services/svc-2-1")
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ price: 1000 });
  assert.equal(editOtherService.status, 403);

  // Owner 2 (chủ salon 2) sửa salon 2 -> 200 OK
  const editOwnSalon = await request(app)
    .put("/api/salons/2")
    .set("Authorization", `Bearer ${owner2Token}`)
    .send({ phone: "02435559999" });
  assert.equal(editOwnSalon.status, 200);
  assert.equal(editOwnSalon.body.salon.phone, "02435559999");
});

// ============================================================================
// Extra 4: Gọi API cần xác thực không có token -> 401 Unauthorized
// ============================================================================
test("Extra 4: Gọi API bảo vệ không có JWT token trả về 401 Unauthorized", async () => {
  const r1 = await request(app).get("/api/bookings/mine");
  assert.equal(r1.status, 401);

  const r2 = await request(app).post("/api/bookings").send({ salonId: 1 });
  assert.equal(r2.status, 401);

  const r3 = await request(app).get("/api/admin/users");
  assert.equal(r3.status, 401);

  // Khách hàng gọi API admin -> 403 Forbidden
  const r4 = await request(app)
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${customerToken}`);
  assert.equal(r4.status, 403);
});

// ============================================================================
// Extra 5: Máy trạng thái lịch hẹn, chống chủ salon tự nâng điểm & race condition chồng lấn
// ============================================================================
test("Extra 5: Máy trạng thái lịch hẹn, chống tự nâng rating, race condition chồng lấn & validate mật khẩu", async () => {
  const workDate = pickFutureDate(["Thứ Hai", "Thứ Tư"]);

  // 1. Không thể chuyển trực tiếp pending -> completed, hoặc completed cho lịch tương lai
  const bk = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "nam-phong",
      serviceIds: ["cao-rau"],
      date: workDate,
      time: "16:00",
    });
  assert.equal(bk.status, 201);
  const id = bk.body.booking.id;

  const skipStep = await request(app)
    .patch(`/api/bookings/${id}/status`)
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ status: "completed" });
  assert.equal(skipStep.status, 400);

  // pending -> confirmed hợp lệ
  const confirmOk = await request(app)
    .patch(`/api/bookings/${id}/status`)
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ status: "confirmed" });
  assert.equal(confirmOk.status, 200);

  // confirmed -> completed cho lịch tương lai chưa diễn ra -> bị chặn 400
  const futureComplete = await request(app)
    .patch(`/api/bookings/${id}/status`)
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ status: "completed" });
  assert.equal(futureComplete.status, 400);

  // Hủy rồi không thể hồi sinh thành confirmed hoặc đổi lịch (reschedule)
  await request(app)
    .post(`/api/bookings/${id}/cancel`)
    .set("Authorization", `Bearer ${customerToken}`);

  const revive = await request(app)
    .patch(`/api/bookings/${id}/status`)
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ status: "confirmed" });
  assert.equal(revive.status, 400);

  const reschedCancelled = await request(app)
    .patch(`/api/bookings/${id}/reschedule`)
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ date: workDate, time: "17:00" });
  assert.equal(reschedCancelled.status, 400);

  // 2. Chủ salon không được tự nâng rating / verified cho thợ
  const beforeBarber = await Barber.findOne({ id: "nam-phong" });
  const editBarber = await request(app)
    .put("/api/barbers/nam-phong")
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ rating: 5, verified: false, title: "Senior Stylist · 7 năm" });
  assert.equal(editBarber.status, 200);
  assert.equal(editBarber.body.barber.rating, beforeBarber.rating);
  assert.equal(editBarber.body.barber.verified, beforeBarber.verified);

  // 3. Chống race condition chồng lấn thời lượng: 09:00 (90p uon-toc) và 10:00 (30p cao-rau) gửi đồng thời
  const raceDate = addDaysISO(workDate, 7);
  const [race1, race2] = await Promise.all([
    request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        salonId: 1,
        barberId: "nam-phong",
        serviceIds: ["uon-toc"], // 90 phút: 09:00 -> 10:30
        date: raceDate,
        time: "09:00",
      }),
    request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        salonId: 1,
        barberId: "nam-phong",
        serviceIds: ["cao-rau"], // 30 phút: 10:00 -> 10:30 (chồng lấn!)
        date: raceDate,
        time: "10:00",
      }),
  ]);
  const statuses = [race1.status, race2.status].sort();
  assert.deepEqual(statuses, [201, 400]);

  // 4. Mật khẩu không phải chuỗi (số) -> trả 400 (không ném 500 từ bcrypt)
  const nonStrPw = await request(app)
    .post("/api/auth/login")
    .send({ email: "khachhang@barberspa.vn", password: 123456 });
  assert.equal(nonStrPw.status, 400);

  // 5. Tạo danh mục vượt cat-10 không bị trùng ID
  for (let i = 0; i < 8; i++) {
    const cRes = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Danh mục thử ${i}`, description: "Test counter" });
    assert.equal(cRes.status, 201);
  }
});

// ============================================================================
// Extra 6: Mã giảm giá (Voucher) & Thông báo trong ứng dụng (Notifications)
// ============================================================================
test("Extra 6: Áp dụng Voucher tính giảm giá ở server & tạo thông báo chuông tự động", async () => {
  // 1. Validate voucher BARBER20 (giảm 20% trên 140.000₫ = 28.000₫)
  const valRes = await request(app)
    .post("/api/vouchers/validate")
    .send({ code: "BARBER20", salonId: 1, subtotal: 140000 });
  assert.equal(valRes.status, 200);
  assert.equal(valRes.body.discountAmount, 28000);
  assert.equal(valRes.body.finalPrice, 112000);

  // 2. Đặt lịch kèm voucher BARBER20 -> server tự trừ 28.000₫ còn 112.000₫
  const voucherDate = pickFutureDate(["Thứ Hai", "Thứ Tư"]);
  const bkRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      salonId: 1,
      barberId: "nam-phong",
      serviceIds: ["cat-toc", "cao-rau"],
      date: voucherDate,
      time: "18:00",
      voucherCode: "BARBER20",
    });
  assert.equal(bkRes.status, 201);
  assert.equal(bkRes.body.booking.voucherCode, "BARBER20");
  assert.equal(bkRes.body.booking.discountAmount, 28000);
  assert.equal(bkRes.body.booking.totalPrice, 112000);

  // 3. Kiểm tra thông báo chuông đã được sinh tự động cho Chủ Salon 1 và Khách hàng
  const ownerNoti = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${owner1Token}`);
  assert.equal(ownerNoti.status, 200);
  assert.ok(ownerNoti.body.unreadCount >= 1);

  const readAll = await request(app)
    .patch("/api/notifications/read-all")
    .set("Authorization", `Bearer ${owner1Token}`);
  assert.equal(readAll.status, 200);

  const afterRead = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${owner1Token}`);
  assert.equal(afterRead.body.unreadCount, 0);
});
