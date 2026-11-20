import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { badRequest, notFound, conflict, forbidden } from "../utils/HttpError.mjs";
import { Salon, Service, Barber, Booking, Category } from "../models/index.mjs";

async function assertOwnsSalon(user, salonId) {
  if (user.role === "admin") return;
  const salon = await Salon.findOne({ id: salonId });
  if (!salon || (salon.ownerId !== user.id && user.salonId !== salonId)) {
    throw forbidden("Bạn không có quyền thao tác trên dữ liệu của salon này.");
  }
}

// ────────────────────── PUBLIC ──────────────────────

/**
 * GET /salons — Trả danh sách salon.
 *  • Admin thấy tất cả (kể cả hidden).
 *  • User/guest chỉ thấy salon active.
 *  • Hỗ trợ ?district= filter.
 */
export const getSalons = asyncHandler(async (req, res) => {
  const filter = {};

  // Chỉ admin mới thấy salon ẩn
  if (!req.user || req.user.role !== "admin") {
    filter.status = "active";
  }

  if (req.query.district) {
    filter.district = req.query.district;
  }

  const salons = await Salon.find(filter).sort({ id: 1 });
  res.json({ salons });
});

/**
 * GET /salons/:id — Chi tiết một salon.
 */
export const getSalonById = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ id: Number(req.params.id) });
  if (!salon) throw notFound("Không tìm thấy salon.");
  res.json({ salon });
});

/**
 * GET /services — Trả danh sách dịch vụ, hỗ trợ ?salonId= filter.
 */
export const getServices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.salonId) filter.salonId = Number(req.query.salonId);
  const services = await Service.find(filter).sort({ id: 1 });
  res.json({ services });
});

/**
 * GET /barbers — Trả danh sách barber, hỗ trợ ?salonId= filter.
 */
export const getBarbers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.salonId) filter.salonId = Number(req.query.salonId);
  const barbers = await Barber.find(filter).sort({ id: 1 });
  res.json({ barbers });
});

/**
 * GET /categories — Trả tất cả categories.
 */
export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ id: 1 });
  res.json({ categories });
});

// ────────────────────── OWNER ──────────────────────

/**
 * PUT /salons/:id — Cập nhật salon (owner / admin).
 * Cho phép sửa: name, address, phone, description, openHours, tags, open, photo.
 */
export const updateSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ id: Number(req.params.id) });
  if (!salon) throw notFound("Không tìm thấy salon.");

  const allowed = ["name", "address", "phone", "description", "openHours", "tags", "open", "photo"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      salon[key] = req.body[key];
    }
  }

  await salon.save();
  res.json({ salon });
});

/**
 * POST /services — Tạo dịch vụ mới.
 * Body cần salonId. Validate categoryId tồn tại.
 */
export const createService = asyncHandler(async (req, res) => {
  const { salonId, categoryId, name, desc, price, duration, active } = req.body;

  if (!salonId) throw badRequest("Thiếu salonId.");
  if (!categoryId) throw badRequest("Thiếu categoryId.");

  // Validate categoryId tồn tại
  const category = await Category.findOne({ id: categoryId });
  if (!category) throw notFound("Danh mục không tồn tại.");

  // Tạo id mới không trùng
  const id = `svc-${salonId}-${Date.now().toString(36)}`;

  const service = await Service.create({
    id,
    salonId,
    categoryId,
    name,
    desc,
    price,
    duration,
    ...(active !== undefined && { active }),
  });

  res.status(201).json({ service });
});

/**
 * PUT /services/:id — Cập nhật dịch vụ.
 * Kiểm tra service.salonId khớp salon ownership (đã qua requireSalonOwner với body/params).
 */
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ id: req.params.id });
  if (!service) throw notFound("Không tìm thấy dịch vụ.");

  // Kiểm tra ownership: admin bypass, owner phải sở hữu salon chứa service
  await assertOwnsSalon(req.user, service.salonId);

  // Nếu đổi categoryId, validate tồn tại
  if (req.body.categoryId) {
    const cat = await Category.findOne({ id: req.body.categoryId });
    if (!cat) throw notFound("Danh mục không tồn tại.");
  }

  const allowed = ["name", "desc", "price", "duration", "categoryId", "active"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      service[key] = req.body[key];
    }
  }

  await service.save();
  res.json({ service });
});

/**
 * DELETE /services/:id — Xóa dịch vụ.
 * TỪ CHỐI nếu có booking pending/confirmed dùng service này (Rule 2.7.1).
 */
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ id: req.params.id });
  if (!service) throw notFound("Không tìm thấy dịch vụ.");

  // Ownership check
  await assertOwnsSalon(req.user, service.salonId);

  // Rule 2.7.1: không được xóa nếu còn booking pending/confirmed dùng service
  const activeBooking = await Booking.findOne({
    serviceIds: service.id,
    status: { $in: ["pending", "confirmed"] },
  });
  if (activeBooking) {
    throw conflict("Không thể xóa dịch vụ vì còn lịch đặt đang chờ hoặc đã xác nhận.");
  }

  await Service.deleteOne({ _id: service._id });
  res.json({ message: "Đã xóa dịch vụ." });
});

/**
 * POST /barbers — Tạo barber mới. Body cần salonId.
 */
export const createBarber = asyncHandler(async (req, res) => {
  const { salonId, name, shortName, title, salon, specialties, photo, workStart, workEnd, daysOff, active } = req.body;

  if (!salonId) throw badRequest("Thiếu salonId.");

  // Tạo id mới không trùng
  const id = `barber-${salonId}-${Date.now().toString(36)}`;

  const barber = await Barber.create({
    id,
    salonId,
    name,
    ...(shortName !== undefined && { shortName }),
    ...(title !== undefined && { title }),
    ...(salon !== undefined && { salon }),
    ...(specialties !== undefined && { specialties }),
    ...(photo !== undefined && { photo }),
    ...(workStart !== undefined && { workStart }),
    ...(workEnd !== undefined && { workEnd }),
    ...(daysOff !== undefined && { daysOff }),
    ...(active !== undefined && { active }),
  });

  res.status(201).json({ barber });
});

/**
 * PUT /barbers/:id — Cập nhật barber.
 */
export const updateBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findOne({ id: req.params.id });
  if (!barber) throw notFound("Không tìm thấy nhân viên.");

  // Ownership check
  await assertOwnsSalon(req.user, barber.salonId);

  // KHÔNG cho chủ salon tự sửa rating, reviews, verified — điểm chỉ do server tính từ đánh giá
  const allowed = ["name", "shortName", "title", "salon", "specialties", "photo", "workStart", "workEnd", "daysOff", "active"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      barber[key] = req.body[key];
    }
  }

  await barber.save();
  res.json({ barber });
});

/**
 * DELETE /barbers/:id — Xóa barber.
 * TỪ CHỐI nếu có booking pending/confirmed của barber này.
 */
export const deleteBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findOne({ id: req.params.id });
  if (!barber) throw notFound("Không tìm thấy nhân viên.");

  // Ownership check
  await assertOwnsSalon(req.user, barber.salonId);

  // Không được xóa nếu còn booking pending/confirmed
  const activeBooking = await Booking.findOne({
    barberId: barber.id,
    status: { $in: ["pending", "confirmed"] },
  });
  if (activeBooking) {
    throw conflict("Không thể xóa nhân viên vì còn lịch đặt đang chờ hoặc đã xác nhận.");
  }

  await Barber.deleteOne({ _id: barber._id });
  res.json({ message: "Đã xóa nhân viên." });
});
