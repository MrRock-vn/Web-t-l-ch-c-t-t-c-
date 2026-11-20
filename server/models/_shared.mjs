/**
 * Tùy chọn chung cho mọi schema:
 * - id: false  -> tắt virtual "id" mặc định của Mongoose vì ta có trường "id" riêng (giữ tương thích dữ liệu cũ)
 * - versionKey: false -> bỏ trường __v
 * - toJSON: luôn ẩn passwordHash khi trả về client
 */
export function schemaOptions(extra = {}) {
  return {
    id: false,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
    ...extra,
  };
}

export const ROLES = ["customer", "owner", "admin"];
export const USER_STATUS = ["active", "locked"];
export const SALON_STATUS = ["active", "hidden"];
export const BOOKING_STATUS = ["pending", "confirmed", "completed", "cancelled"];
export const PAYMENT_STATUS = ["unpaid", "paid", "refund_requested", "refunded"];
export const PAYMENT_METHODS = ["counter", "vnpay"];
export const PAYMENT_RECORD_STATUS = ["pending", "paid", "refund_requested", "refunded", "failed"];
export const DISTRICTS = ["Hoàn Kiếm", "Đống Đa", "Cầu Giấy", "Hai Bà Trưng", "Tây Hồ", "Ba Đình"];
export const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

