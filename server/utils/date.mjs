// Mọi tính toán ngày giờ nghiệp vụ dùng múi giờ Việt Nam (UTC+07)
export const TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Ngày hiện tại dạng YYYY-MM-DD theo giờ Việt Nam */
export function todayISO(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Cộng/trừ số ngày vào chuỗi YYYY-MM-DD */
export function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** "HH:mm" -> số phút trong ngày */
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Số phút -> "HH:mm" */
export function fromMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Thời điểm (Date) tương ứng với ngày + giờ theo giờ Việt Nam */
export function vnDateTime(dateISO, hhmm) {
  return new Date(`${dateISO}T${hhmm}:00+07:00`);
}

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

