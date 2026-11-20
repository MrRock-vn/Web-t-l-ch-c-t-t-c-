/**
 * Seed database với dữ liệu mẫu cho Barber Spa.
 * Dùng bcryptjs để hash password (KHÔNG dùng crypto.scryptSync).
 *
 * Chạy standalone:  npm run seed
 * Hoặc được gọi tự động khi connectDB() phát hiện DB trống.
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  User,
  Salon,
  Category,
  Service,
  Barber,
  Booking,
  Payment,
  Review,
  Voucher,
  Notification,
} from "./models/index.mjs";

/* ------------------------------------------------------------------ */
/*  Helper: hash password                                              */
/* ------------------------------------------------------------------ */
const h = (plain) => bcrypt.hashSync(plain, 10);

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

// ── Users ──────────────────────────────────────────────────────────
const users = [
  {
    id: 1,
    name: "Quản Trị Viên Hệ Thống",
    email: "admin@barberspa.vn",
    passwordHash: h("admin123"),
    phone: "0901000111",
    role: "admin",
    title: "Trưởng ban Quản trị",
    status: "active",
  },
  {
    id: 2,
    name: "Nguyễn Công Sơn (Chủ Barber 36)",
    email: "owner@barberspa.vn",
    passwordHash: h("owner123"),
    phone: "0912363636",
    role: "owner",
    salonId: 1,
    status: "active",
  },
  {
    id: 3,
    name: "Nguyễn Văn Quang (Chủ GentsCut)",
    email: "gentscut@barberspa.vn",
    passwordHash: h("owner123"),
    phone: "0912888999",
    role: "owner",
    salonId: 2,
    status: "active",
  },
  {
    id: 4,
    name: "Hoàng Minh Tuấn",
    email: "khachhang@barberspa.vn",
    passwordHash: h("123456"),
    phone: "0987654321",
    role: "customer",
    address: "15 Phố Huế, Hai Bà Trưng, Hà Nội",
    birthDate: "2002-05-18",
    status: "active",
  },
];

// ── Salons ─────────────────────────────────────────────────────────
const salons = [
  {
    id: 1,
    name: "Barber 36",
    district: "Hoàn Kiếm",
    address: "36 Hàng Bài, Hoàn Kiếm, Hà Nội",
    phone: "02438253636",
    description:
      "Không gian barber cổ điển châu Âu giữa lòng phố cổ Hoàn Kiếm, chuyên fade và cạo râu khăn nóng.",
    rating: 4.9,
    reviews: 412,
    priceFrom: 80000,
    tags: ["Cắt tóc", "Cạo râu", "Combo VIP"],
    verified: true,
    open: true,
    status: "active",
    openHours: "08:00 - 20:30",
    photo:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=380&fit=crop&auto=format",
    booked: 128,
    ownerId: 2,
  },
  {
    id: 2,
    name: "GentsCut Studio",
    district: "Đống Đa",
    address: "118 Chùa Bộc, Đống Đa, Hà Nội",
    phone: "02435558899",
    description:
      "Studio tạo kiểu tóc nam trẻ trung, chuyên uốn xoăn Hàn Quốc và nhuộm màu thời trang.",
    rating: 4.8,
    reviews: 287,
    priceFrom: 80000,
    tags: ["Cắt tóc", "Nhuộm tóc", "Uốn tóc"],
    verified: true,
    open: true,
    status: "active",
    openHours: "08:30 - 21:00",
    photo:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=380&fit=crop&auto=format",
    booked: 96,
    ownerId: 3,
  },
  {
    id: 3,
    name: "The Gentlemen",
    district: "Cầu Giấy",
    address: "47 Trần Đăng Ninh, Cầu Giấy, Hà Nội",
    phone: "02437914747",
    description:
      "Trải nghiệm Barber & Spa 5 sao dành cho quý ông với phòng massage đầu và chăm sóc da chuyên sâu.",
    rating: 5,
    reviews: 561,
    priceFrom: 100000,
    tags: ["Combo VIP", "Cắt tóc", "Massage đầu"],
    verified: true,
    open: true,
    status: "active",
    openHours: "08:00 - 21:00",
    photo:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=380&fit=crop&auto=format",
    booked: 215,
    ownerId: 2,
  },
  {
    id: 4,
    name: "UrbanBarber",
    district: "Hai Bà Trưng",
    address: "23 Lê Đại Hành, Hai Bà Trưng, Hà Nội",
    phone: "02439742323",
    description:
      "Phong cách đường phố hiện đại, chuyên skin fade sắc nét và tạo kiểu undercut.",
    rating: 4.7,
    reviews: 198,
    priceFrom: 75000,
    tags: ["Cắt tóc", "Cạo râu"],
    verified: false,
    open: true,
    status: "active",
    openHours: "09:00 - 20:00",
    photo:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=380&fit=crop&auto=format",
    booked: 74,
    ownerId: 3,
  },
  {
    id: 5,
    name: "Classic Hair",
    district: "Ba Đình",
    address: "5 Liễu Giai, Ba Đình, Hà Nội",
    phone: "02437625555",
    description:
      "Tiệm tóc truyền thống kết hợp gội đầu thảo dược thư giãn cổ vai gáy.",
    rating: 4.6,
    reviews: 143,
    priceFrom: 70000,
    tags: ["Cắt tóc", "Gội đầu"],
    verified: true,
    open: true,
    status: "active",
    openHours: "08:00 - 19:30",
    photo: "/images/salon-classic-hair.jpg",
    booked: 52,
    ownerId: 2,
  },
  {
    id: 6,
    name: "Fade & Sharp",
    district: "Tây Hồ",
    address: "12 Xuân Diệu, Tây Hồ, Hà Nội",
    phone: "02437191212",
    description:
      "Không gian mở hướng hồ Tây, đội ngũ Master Barber giàu kinh nghiệm quốc tế.",
    rating: 4.9,
    reviews: 334,
    priceFrom: 100000,
    tags: ["Skin fade", "Uốn tóc", "Combo VIP"],
    verified: true,
    open: true,
    status: "active",
    openHours: "08:30 - 20:30",
    photo: "/images/salon-fade-sharp.jpg",
    booked: 161,
    ownerId: 3,
  },
];

// ── Categories ─────────────────────────────────────────────────────
const categories = [
  { id: "cat-1", name: "Cắt & Tạo kiểu", description: "Cắt tóc nam, tạo kiểu cổ điển và hiện đại" },
  { id: "cat-2", name: "Hóa chất & Uốn Nhuộm", description: "Uốn tóc, nhuộm màu thời trang, tẩy tóc" },
  { id: "cat-3", name: "Chăm sóc & Thư giãn", description: "Cạo râu khăn nóng, gội đầu dưỡng sinh, massage" },
  { id: "cat-4", name: "Combo Trọn gói", description: "Gói dịch vụ VIP tiết kiệm chi phí" },
];

// ── Services ───────────────────────────────────────────────────────
const services = [
  // Salon 1 — Barber 36 (giữ 5 services gốc)
  { id: "cat-toc",  salonId: 1, categoryId: "cat-1", name: "Cắt tóc",   desc: "Tạo kiểu chuẩn theo khuôn mặt, bao gồm gội và sấy tạo kiểu hoàn chỉnh.", price: 80000,  duration: 45,  active: true },
  { id: "uon-toc",  salonId: 1, categoryId: "cat-2", name: "Uốn tóc",   desc: "Uốn xoăn hoặc duỗi thẳng với sản phẩm cao cấp, dưỡng chất chuyên sâu.", price: 350000, duration: 90,  active: true },
  { id: "nhuom-toc", salonId: 1, categoryId: "cat-2", name: "Nhuộm tóc", desc: "Nhuộm màu thời trang, highlight hoặc ombre theo xu hướng mới nhất.", price: 280000, duration: 120, active: true },
  { id: "cao-rau",  salonId: 1, categoryId: "cat-3", name: "Cạo râu",   desc: "Cạo râu truyền thống với dao cạo thẳng, khăn nóng và dầu dưỡng da.", price: 60000,  duration: 30,  active: true },
  { id: "combo-vip", salonId: 1, categoryId: "cat-4", name: "Combo VIP", desc: "Cắt tóc + Cạo râu + Gội dưỡng + Massage đầu. Trải nghiệm hoàn chỉnh từ A đến Z.", price: 450000, duration: 150, active: true },

  // Salon 2 — GentsCut Studio
  { id: "svc-2-1", salonId: 2, categoryId: "cat-1", name: "Cắt tóc nam Hàn Quốc",   desc: "Tạo kiểu tóc nam theo phong cách Hàn Quốc, layer nhẹ, sấy phồng tự nhiên.", price: 90000,  duration: 45,  active: true },
  { id: "svc-2-2", salonId: 2, categoryId: "cat-2", name: "Nhuộm màu thời trang",   desc: "Nhuộm highlight, balayage hoặc màu pastel theo yêu cầu.",               price: 300000, duration: 120, active: true },
  { id: "svc-2-3", salonId: 2, categoryId: "cat-2", name: "Uốn xoăn Hàn Quốc",      desc: "Uốn setting perm tạo sóng lọn tự nhiên phong cách Hàn.",                 price: 380000, duration: 100, active: true },
  { id: "svc-2-4", salonId: 2, categoryId: "cat-3", name: "Gội đầu dưỡng sinh",      desc: "Gội massage thư giãn với tinh dầu thiên nhiên, ấn huyệt cổ vai gáy.",    price: 70000,  duration: 30,  active: true },

  // Salon 3 — The Gentlemen
  { id: "svc-3-1", salonId: 3, categoryId: "cat-1", name: "Cắt tóc Classic",     desc: "Tạo kiểu cổ điển gentleman, side part hoặc pompadour.",                price: 100000, duration: 50,  active: true },
  { id: "svc-3-2", salonId: 3, categoryId: "cat-3", name: "Massage đầu thư giãn", desc: "Massage đầu, cổ, vai gáy kết hợp tinh dầu nóng 30 phút.",             price: 120000, duration: 30,  active: true },
  { id: "svc-3-3", salonId: 3, categoryId: "cat-4", name: "Combo Gentleman VIP",  desc: "Cắt tóc + Cạo râu + Massage đầu + Đắp mặt nạ dưỡng da.",             price: 500000, duration: 160, active: true },

  // Salon 4 — UrbanBarber
  { id: "svc-4-1", salonId: 4, categoryId: "cat-1", name: "Skin Fade",           desc: "Fade sắc nét từ 0mm, blend hoàn hảo lên đỉnh.",                       price: 85000,  duration: 40,  active: true },
  { id: "svc-4-2", salonId: 4, categoryId: "cat-1", name: "Undercut tạo kiểu",   desc: "Undercut kết hợp texture trên đỉnh, sấy tạo kiểu hoàn chỉnh.",       price: 90000,  duration: 45,  active: true },
  { id: "svc-4-3", salonId: 4, categoryId: "cat-3", name: "Cạo râu dao thẳng",   desc: "Cạo râu truyền thống dao thẳng, khăn nóng và serum dưỡng da.",        price: 65000,  duration: 25,  active: true },

  // Salon 5 — Classic Hair
  { id: "svc-5-1", salonId: 5, categoryId: "cat-1", name: "Cắt tóc truyền thống", desc: "Cắt tóc nam kiểu truyền thống, kéo và tông-đơ kết hợp.",              price: 70000,  duration: 40,  active: true },
  { id: "svc-5-2", salonId: 5, categoryId: "cat-3", name: "Gội đầu thảo dược",    desc: "Gội đầu với dầu gội thảo dược, massage nhẹ nhàng thư giãn.",          price: 60000,  duration: 25,  active: true },
  { id: "svc-5-3", salonId: 5, categoryId: "cat-4", name: "Combo Cắt + Gội",      desc: "Cắt tóc truyền thống kết hợp gội đầu thảo dược tiết kiệm.",          price: 110000, duration: 60,  active: true },

  // Salon 6 — Fade & Sharp
  { id: "svc-6-1", salonId: 6, categoryId: "cat-1", name: "Master Fade",          desc: "Kỹ thuật fade quốc tế bởi Master Barber, bao gồm tư vấn kiểu.",      price: 120000, duration: 50,  active: true },
  { id: "svc-6-2", salonId: 6, categoryId: "cat-2", name: "Uốn tóc layer",        desc: "Uốn cold perm tạo layer sóng nhẹ tự nhiên.",                          price: 400000, duration: 100, active: true },
  { id: "svc-6-3", salonId: 6, categoryId: "cat-4", name: "Combo Premium",         desc: "Fade + Cạo râu + Gội dưỡng + Massage đầu vai gáy.",                   price: 550000, duration: 170, active: true },
];

// ── Barbers ────────────────────────────────────────────────────────
const barbers = [
  // Salon 1 — Barber 36
  {
    id: "khoi", salonId: 1,
    name: "Nguyễn Minh Khôi", shortName: "Minh Khôi",
    title: "Senior Barber · 8 năm", salon: "Barber 36 - Hoàn Kiếm",
    rating: 4.9, reviews: 312,
    specialties: ["Fade cổ điển", "Pompadour", "Cạo râu"],
    photo: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=480&fit=crop&auto=format",
    verified: true, workStart: "08:00", workEnd: "20:00",
    daysOff: ["Thứ Hai"], active: true,
  },
  {
    id: "nam-phong", salonId: 1,
    name: "Vũ Nam Phong", shortName: "Nam Phong",
    title: "Stylist · 6 năm", salon: "Barber 36 - Hoàn Kiếm",
    rating: 4.8, reviews: 165,
    specialties: ["Side part", "Uốn tóc", "Gội dưỡng"],
    photo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=480&fit=crop&auto=format",
    verified: true, workStart: "08:00", workEnd: "20:00",
    daysOff: ["Thứ Tư"], active: true,
  },

  // Salon 2 — GentsCut Studio
  {
    id: "duc-anh", salonId: 2,
    name: "Trần Đức Anh", shortName: "Đức Anh",
    title: "Barber · 5 năm", salon: "GentsCut - Đống Đa",
    rating: 4.8, reviews: 204,
    specialties: ["Undercut", "Textured crop", "Nhuộm"],
    photo: "/images/barber-duc-anh.jpg",
    verified: true, workStart: "08:30", workEnd: "20:30",
    daysOff: [], active: true,
  },

  // Salon 3 — The Gentlemen
  {
    id: "hung", salonId: 3,
    name: "Phạm Văn Hùng", shortName: "Văn Hùng",
    title: "Master Barber · 10 năm", salon: "The Gentlemen - Cầu Giấy",
    rating: 5, reviews: 445,
    specialties: ["Classic cuts", "Pomade styles", "VIP Combo"],
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=480&fit=crop&auto=format",
    verified: true, workStart: "08:00", workEnd: "21:00",
    daysOff: [], active: true,
  },

  // Salon 4 — UrbanBarber
  {
    id: "binh", salonId: 4,
    name: "Lê Thanh Bình", shortName: "Thanh Bình",
    title: "Barber · 6 năm", salon: "UrbanBarber - Hai Bà Trưng",
    rating: 4.9, reviews: 278,
    specialties: ["Skin fade", "Quiff", "Uốn xoăn"],
    photo: "/images/barber-thanh-binh.jpg",
    verified: true, workStart: "09:00", workEnd: "19:30",
    daysOff: ["Thứ Ba"], active: true,
  },

  // Salon 5 — Classic Hair
  {
    id: "barber-5-1", salonId: 5,
    name: "Đỗ Quang Hải", shortName: "Quang Hải",
    title: "Barber · 4 năm", salon: "Classic Hair - Ba Đình",
    rating: 4.6, reviews: 98,
    specialties: ["Cắt truyền thống", "Gội thảo dược"],
    photo: "/images/barber-quang-hai.jpg",
    verified: true, workStart: "08:00", workEnd: "19:30",
    daysOff: ["Chủ Nhật"], active: true,
  },

  // Salon 6 — Fade & Sharp
  {
    id: "barber-6-1", salonId: 6,
    name: "Hoàng Việt Dũng", shortName: "Việt Dũng",
    title: "Master Barber · 9 năm", salon: "Fade & Sharp - Tây Hồ",
    rating: 4.9, reviews: 256,
    specialties: ["Skin fade", "Razor fade", "Combo VIP"],
    photo: "/images/barber-viet-dung.jpg",
    verified: true, workStart: "08:30", workEnd: "20:30",
    daysOff: ["Thứ Hai"], active: true,
  },
];

// ── Bookings ───────────────────────────────────────────────────────
const bookings = [
  {
    id: "BS-10241", customerId: 4,
    customerName: "Hoàng Minh Tuấn", customerPhone: "0987654321",
    salonId: 1, salonName: "Barber 36",
    serviceIds: ["cat-toc", "cao-rau"], serviceNames: "Cắt tóc, Cạo râu",
    barberId: "khoi", barberName: "Nguyễn Minh Khôi",
    date: "2026-11-08", time: "09:00",
    totalDuration: 75, totalPrice: 140000,
    paymentMethod: "vnpay", paymentStatus: "paid",
    status: "confirmed",
    note: "Cắt kiểu Classic Fade, cạo râu khăn nóng",
    reviewed: false,
    createdAt: new Date("2026-10-25T08:30:00.000Z"),
  },
  {
    id: "BS-10198", customerId: 4,
    customerName: "Hoàng Minh Tuấn", customerPhone: "0987654321",
    salonId: 1, salonName: "Barber 36",
    serviceIds: ["combo-vip"], serviceNames: "Combo VIP",
    barberId: "khoi", barberName: "Nguyễn Minh Khôi",
    date: "2026-10-20", time: "15:00",
    totalDuration: 150, totalPrice: 450000,
    paymentMethod: "vnpay", paymentStatus: "paid",
    status: "completed",
    note: "Combo trọn gói cuối tuần",
    reviewed: false,
    createdAt: new Date("2026-10-18T10:15:00.000Z"),
  },
  {
    id: "BS-10112", customerId: 4,
    customerName: "Hoàng Minh Tuấn", customerPhone: "0987654321",
    salonId: 2, salonName: "GentsCut Studio",
    serviceIds: ["nhuom-toc"], serviceNames: "Nhuộm tóc",
    barberId: "duc-anh", barberName: "Trần Đức Anh",
    date: "2026-10-12", time: "10:30",
    totalDuration: 120, totalPrice: 280000,
    paymentMethod: "counter", paymentStatus: "paid",
    status: "completed",
    note: "Nhuộm nâu khói trầm",
    reviewed: true,
    createdAt: new Date("2026-10-10T09:00:00.000Z"),
  },
];

// ── Payments ───────────────────────────────────────────────────────
const payments = [
  {
    id: "PAY-9001", bookingId: "BS-10241", customerId: 4,
    amount: 140000, method: "vnpay",
    vnpTxnRef: "VNP202610250900", vnpSignature: "84DF0ABF47FEC32E519397B6",
    status: "paid", paidAt: new Date("2026-10-25T08:31:00.000Z"),
  },
  {
    id: "PAY-8942", bookingId: "BS-10198", customerId: 4,
    amount: 450000, method: "vnpay",
    vnpTxnRef: "VNP202610181500", vnpSignature: "1B51BCF6D8AACDA16127079A",
    status: "paid", paidAt: new Date("2026-10-18T10:16:00.000Z"),
  },
];

// ── Reviews ────────────────────────────────────────────────────────
const reviews = [
  {
    id: "rev-1", bookingId: "BS-10001", customerId: 4,
    name: "Hoàng Minh Tuấn",
    date: "12 tháng 10, 2026", createdAt: new Date("2026-10-12T14:00:00.000Z"),
    rating: 5,
    text: "Thợ cắt rất lành nghề, lắng nghe yêu cầu kỹ càng và cho kết quả vượt kỳ vọng. Không gian sạch sẽ, mùi hương dễ chịu. Chắc chắn sẽ quay lại!",
    service: "Cắt tóc + Cạo râu", barber: "Minh Khôi", avatar: "HT",
    salonId: 1, salon: "Barber 36 - Hoàn Kiếm",
    ownerReply: "Cảm ơn anh Minh Tuấn đã tin tưởng Barber 36! Hẹn gặp lại anh lần tới nhé.",
    reported: false, reportReason: "", hidden: false,
  },
  {
    id: "rev-2", bookingId: "BS-10002", customerId: 5,
    name: "Nguyễn Thị Lan",
    date: "5 tháng 10, 2026", createdAt: new Date("2026-10-05T16:00:00.000Z"),
    rating: 5,
    text: "Đặt lịch qua web cực kỳ tiện lợi, không phải chờ. Đến đúng giờ là vào ghế ngay. Dịch vụ nhuộm tóc chuyên nghiệp, màu lên đẹp và đều.",
    service: "Nhuộm tóc", barber: "Đức Anh", avatar: "NL",
    salonId: 2, salon: "GentsCut - Đống Đa",
    ownerReply: "GentsCut Studio rất vui vì chị hài lòng với màu tóc mới ạ!",
    reported: false, reportReason: "", hidden: false,
  },
  {
    id: "rev-3", bookingId: "BS-10003", customerId: 6,
    name: "Trần Văn Phúc",
    date: "28 tháng 9, 2026", createdAt: new Date("2026-09-28T11:30:00.000Z"),
    rating: 5,
    text: "Combo VIP xứng đáng từng đồng. Cắt tóc, cạo râu, gội dưỡng, massage đầu — tất cả đều xuất sắc. Cảm giác như được chăm sóc tại spa 5 sao.",
    service: "Combo VIP", barber: "Văn Hùng", avatar: "TP",
    salonId: 3, salon: "The Gentlemen - Cầu Giấy",
    ownerReply: "", reported: false, reportReason: "", hidden: false,
  },
  {
    id: "rev-4", bookingId: "BS-10004", customerId: 7,
    name: "Lê Đức Thịnh",
    date: "20 tháng 9, 2026", createdAt: new Date("2026-09-20T17:00:00.000Z"),
    rating: 4,
    text: "Thợ Thanh Bình rất giỏi kỹ thuật fade. Kiểu tóc đúng như ảnh tham khảo tôi gửi. Giá cả hợp lý so với chất lượng nhận được.",
    service: "Cắt tóc", barber: "Thanh Bình", avatar: "LT",
    salonId: 4, salon: "UrbanBarber - Hai Bà Trưng",
    ownerReply: "", reported: false, reportReason: "", hidden: false,
  },
  {
    id: "rev-5", bookingId: "BS-10005", customerId: 8,
    name: "Phạm Quang Huy",
    date: "15 tháng 9, 2026", createdAt: new Date("2026-09-15T15:20:00.000Z"),
    rating: 5,
    text: "Không gian cực kỳ sang chảnh nhưng giá không đắt. Đặt lịch online nhanh, thợ nhiệt tình tư vấn kiểu phù hợp với khuôn mặt. Rất hài lòng!",
    service: "Cắt tóc + Uốn tóc", barber: "Minh Khôi", avatar: "PH",
    salonId: 1, salon: "Barber 36 - Hoàn Kiếm",
    ownerReply: "", reported: false, reportReason: "", hidden: false,
  },
];

// ── Vouchers ───────────────────────────────────────────────────────
const vouchers = [
  {
    code: "BARBER20",
    title: "Giảm 20% (tối đa 80.000₫)",
    discountType: "percent",
    discountValue: 20,
    maxDiscount: 80000,
    minOrder: 60000,
    maxUses: 100,
    usedCount: 12,
    expiresAt: "2027-12-31",
    salonId: null,
    active: true,
  },
  {
    code: "GIAM30K",
    title: "Giảm ngay 30.000₫ cho đơn từ 100.000₫",
    discountType: "fixed",
    discountValue: 30000,
    maxDiscount: 0,
    minOrder: 100000,
    maxUses: 200,
    usedCount: 25,
    expiresAt: "2027-12-31",
    salonId: null,
    active: true,
  },
  {
    code: "VIP50K",
    title: "Giảm 50.000₫ cho Combo từ 250.000₫",
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 250000,
    maxUses: 50,
    usedCount: 5,
    expiresAt: "2027-12-31",
    salonId: null,
    active: true,
  },
];

// ── Notifications ──────────────────────────────────────────────────
const notifications = [
  {
    id: "noti-seed-1",
    userId: 4,
    title: "Lịch hẹn BS-10241 đã được xác nhận",
    message: "Barber 36 đã xác nhận lịch Cắt tóc, Cạo râu lúc 09:00 cùng thợ Nguyễn Minh Khôi.",
    type: "booking",
    read: false,
    createdAt: new Date("2026-10-25T08:35:00.000Z"),
  },
  {
    id: "noti-seed-2",
    userId: 2,
    title: "Có lịch hẹn mới BS-10241",
    message: "Khách Hoàng Minh Tuấn vừa đặt lịch Cắt tóc, Cạo râu tại Barber 36 (đã thanh toán VNPay).",
    type: "booking",
    read: false,
    createdAt: new Date("2026-10-25T08:31:00.000Z"),
  },
];

/* ================================================================== */
/*  seedDatabase()                                                      */
/* ================================================================== */
export async function seedDatabase() {
  console.log("[seed] Bắt đầu seed dữ liệu mẫu...");

  // Xóa toàn bộ dữ liệu cũ
  await Promise.all([
    User.deleteMany({}),
    Salon.deleteMany({}),
    Category.deleteMany({}),
    Service.deleteMany({}),
    Barber.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Voucher.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // Insert theo thứ tự (users trước vì có references)
  await User.insertMany(users);
  console.log(`  ✔ ${users.length} users`);

  await Salon.insertMany(salons);
  console.log(`  ✔ ${salons.length} salons`);

  await Category.insertMany(categories);
  console.log(`  ✔ ${categories.length} categories`);

  await Service.insertMany(services);
  console.log(`  ✔ ${services.length} services`);

  await Barber.insertMany(barbers);
  console.log(`  ✔ ${barbers.length} barbers`);

  await Booking.insertMany(bookings);
  console.log(`  ✔ ${bookings.length} bookings`);

  await Payment.insertMany(payments);
  console.log(`  ✔ ${payments.length} payments`);

  await Review.insertMany(reviews);
  console.log(`  ✔ ${reviews.length} reviews`);

  await Voucher.insertMany(vouchers);
  console.log(`  ✔ ${vouchers.length} vouchers`);

  await Notification.insertMany(notifications);
  console.log(`  ✔ ${notifications.length} notifications`);

  console.log("[seed] Seed hoàn tất!");
}

/* ================================================================== */
/*  Standalone runner: npm run seed                                     */
/* ================================================================== */
const isMain =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isMain) {
  const { env } = await import("./config/env.mjs");
  const { connectDB, disconnectDB } = await import("./config/db.mjs");

  try {
    await connectDB();
    await seedDatabase();
  } catch (err) {
    console.error("[seed] Lỗi:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
