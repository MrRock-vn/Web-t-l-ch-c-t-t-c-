/** Lỗi nghiệp vụ có mã HTTP — errorHandler sẽ trả về dạng { error: message } */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const unauthorized = (msg = "Bạn cần đăng nhập để thực hiện thao tác này.") => new HttpError(401, msg);
export const forbidden = (msg = "Bạn không có quyền thực hiện thao tác này.") => new HttpError(403, msg);
export const notFound = (msg = "Không tìm thấy dữ liệu.") => new HttpError(404, msg);
export const conflict = (msg) => new HttpError(409, msg);

