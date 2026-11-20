import { asyncHandler } from "../middleware/asyncHandler.mjs";
import { badRequest, notFound, conflict } from "../utils/HttpError.mjs";
import { User, Salon, Category, Service, Booking, Review, Payment, nextSequence } from "../models/index.mjs";

/**
 * GET /admin/overview — Thống kê tổng quan.
 */
export const getOverview = asyncHandler(async (_req, res) => {
  const [totalUsers, totalSalons, totalBookings, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Salon.countDocuments(),
    Booking.countDocuments(),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  res.json({
    overview: {
      totalUsers,
      totalSalons,
      totalBookings,
      totalRevenue,
    },
  });
});

/**
 * GET /admin/users — Trả tất cả users (không trả passwordHash).
 */
export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ id: 1 });
  res.json({ users });
});

/**
 * PATCH /admin/users/:id/lock — Khóa / mở khóa user.
 * Body: { locked: boolean }
 * KHÔNG cho admin tự khóa mình.
 */
export const lockUser = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { locked } = req.body;

  if (locked === undefined) throw badRequest("Thiếu trường locked.");

  // Không cho admin tự khóa chính mình
  if (req.user.id === targetId) {
    throw badRequest("Bạn không thể khóa chính mình.");
  }

  const user = await User.findOne({ id: targetId });
  if (!user) throw notFound("Không tìm thấy người dùng.");

  user.status = locked ? "locked" : "active";
  await user.save();

  res.json({ user });
});

/**
 * PATCH /admin/salons/:id — Duyệt / ẩn salon.
 * Body: { verified?, status? }
 */
export const manageSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ id: Number(req.params.id) });
  if (!salon) throw notFound("Không tìm thấy salon.");

  const { verified, status } = req.body;

  if (verified !== undefined) salon.verified = verified;
  if (status !== undefined) salon.status = status;

  await salon.save();
  res.json({ salon });
});

/**
 * POST /admin/categories — Tạo danh mục mới.
 * Body: { name, description }
 * Tạo id = 'cat-' + next number.
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw badRequest("Thiếu tên danh mục.");

  // Cấp ID nguyên tử bằng Counter (khắc phục lỗi sort chuỗi "cat-9" > "cat-10")
  const existingCats = await Category.find({}, { id: 1 });
  const maxExisting = existingCats.reduce((max, c) => {
    const m = c.id.match(/^cat-(\d+)$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  const nextNum = await nextSequence("categories", maxExisting);

  const category = await Category.create({
    id: `cat-${nextNum}`,
    name,
    description: description || "",
  });

  res.status(201).json({ category });
});

/**
 * PUT /admin/categories/:id — Cập nhật danh mục.
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ id: req.params.id });
  if (!category) throw notFound("Không tìm thấy danh mục.");

  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.description !== undefined) category.description = req.body.description;

  await category.save();
  res.json({ category });
});

/**
 * DELETE /admin/categories/:id — Xóa danh mục.
 * TỪ CHỐI nếu còn service dùng categoryId này (Rule 2.8.1).
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ id: req.params.id });
  if (!category) throw notFound("Không tìm thấy danh mục.");

  // Rule 2.8.1: không được xóa nếu còn service dùng categoryId
  const serviceCount = await Service.countDocuments({ categoryId: category.id });
  if (serviceCount > 0) {
    throw conflict(`Không thể xóa danh mục vì còn ${serviceCount} dịch vụ đang sử dụng.`);
  }

  await Category.deleteOne({ _id: category._id });
  res.json({ message: "Đã xóa danh mục." });
});
