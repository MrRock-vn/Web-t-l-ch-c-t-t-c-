/** Bọc controller async để lỗi được chuyển tới errorHandler (Express 4 không tự bắt Promise reject) */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

