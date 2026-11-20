// Lớp gọi REST API tập trung cho Barber Spa (đi qua Vite proxy /api -> http://localhost:4000)

const TOKEN_KEY = "barber_spa_jwt_token";

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Đọc trực tiếp cookie XSRF-TOKEN hiện hành trên trình duyệt để tránh lỗi lệch token
 * khi người dùng mở nhiều tab song song (tab B cấp cookie mới -> tab A tự đọc cookie mới nhất).
 */
function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  const fromCookie = readCsrfCookie();
  if (fromCookie) return fromCookie;
  try {
    const res = await fetch("/api/auth/csrf-token", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      return readCsrfCookie() || data.csrfToken || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Trả ngày dạng YYYY-MM-DD theo múi giờ Việt Nam (UTC+07),
 * thay thế cho new Date().toISOString().slice(0, 10) vốn bị lệch ngày theo UTC.
 */
export function localDateISO(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function localTodayISO(): string {
  return localDateISO(new Date());
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = await ensureCsrfToken();
    if (csrf) {
      headers["X-CSRF-Token"] = csrf;
    }
  }

  const res = await fetch(path, { credentials: "same-origin", ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data && typeof data.error === "string" && data.error) ||
        `Yêu cầu thất bại (HTTP ${res.status})`
    );
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ user: any; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: Record<string, unknown>) =>
    apiRequest<{ user: any; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest<{ user: any }>("/api/auth/me"),
  logout: () => apiRequest<{ message: string }>("/api/auth/logout", { method: "POST" }),
  updateProfile: (payload: Record<string, unknown>) =>
    apiRequest<{ user: any }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Public catalog
  getSalons: (district?: string) =>
    apiRequest<{ salons: any[] }>(
      district && district !== "Tất cả"
        ? `/api/salons?district=${encodeURIComponent(district)}`
        : "/api/salons"
    ),
  getServices: (salonId?: number) =>
    apiRequest<{ services: any[] }>(
      salonId ? `/api/services?salonId=${salonId}` : "/api/services"
    ),
  getBarbers: (salonId?: number) =>
    apiRequest<{ barbers: any[] }>(
      salonId ? `/api/barbers?salonId=${salonId}` : "/api/barbers"
    ),
  getCategories: () => apiRequest<{ categories: any[] }>("/api/categories"),
  getReviews: (salonId?: number) =>
    apiRequest<{ reviews: any[] }>(
      salonId ? `/api/reviews?salonId=${salonId}` : "/api/reviews"
    ),

  // Booking & Availability
  getAvailability: (salonId: number, params: { barberId?: string; date: string; duration?: number }) => {
    const qs = new URLSearchParams({ date: params.date });
    if (params.barberId && params.barberId !== "any") qs.set("barberId", params.barberId);
    if (params.duration) qs.set("duration", String(params.duration));
    return apiRequest<{
      availability: Array<{ barberId: string; barberName: string; date: string; slots: string[] }>;
    }>(`/api/salons/${salonId}/availability?${qs.toString()}`);
  },
  getMyBookings: () => apiRequest<{ bookings: any[] }>("/api/bookings/mine"),
  createBooking: (payload: Record<string, unknown>) =>
    apiRequest<{ booking: any }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancelBooking: (id: string) =>
    apiRequest<{ booking: any }>(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    }),
  rescheduleBooking: (id: string, date: string, time: string) =>
    apiRequest<{ booking: any }>(`/api/bookings/${encodeURIComponent(id)}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({ date, time }),
    }),
  updateBookingStatus: (id: string, status: string) =>
    apiRequest<{ booking: any }>(`/api/bookings/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Payments
  getPayments: () => apiRequest<{ payments: any[] }>("/api/payments"),
  createVnpayPayment: (bookingId: string) =>
    apiRequest<{ paymentUrl: string; simulateReturnUrl?: string; simulated?: boolean; payment: any }>(
      "/api/payments/vnpay/create",
      {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      }
    ),
  verifyVnpayReturn: (simulateReturnUrl: string) =>
    apiRequest<{ verified: boolean; status: string; payment: any; booking: any }>(
      simulateReturnUrl
    ),
  requestRefund: (bookingId: string) =>
    apiRequest<{ booking: any; payment: any }>(
      `/api/payments/${encodeURIComponent(bookingId)}/refund-request`,
      { method: "POST" }
    ),
  processRefundAdmin: (bookingId: string, action: "approve" | "reject") =>
    apiRequest<{ booking: any; payment: any }>(
      `/api/admin/payments/${encodeURIComponent(bookingId)}/refund`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }
    ),

  // Reviews
  createReview: (payload: { bookingId: string; rating: number; text: string; photoUrl?: string }) =>
    apiRequest<{ review: any }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateReview: (id: string, payload: { rating: number; text: string }) =>
    apiRequest<{ review: any }>(`/api/reviews/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  replyReview: (id: string, reply: string) =>
    apiRequest<{ review: any }>(`/api/reviews/${encodeURIComponent(id)}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    }),
  reportReview: (id: string, reason: string) =>
    apiRequest<{ review: any }>(`/api/reviews/${encodeURIComponent(id)}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  moderateReview: (id: string, action: "keep" | "hide" | "delete") =>
    apiRequest<{ review?: any; message?: string }>(
      `/api/admin/reviews/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }
    ),

  // Owner
  updateSalon: (salonId: number, updates: Record<string, unknown>) =>
    apiRequest<{ salon: any }>(`/api/salons/${salonId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),
  createService: (payload: Record<string, unknown>) =>
    apiRequest<{ service: any }>("/api/services", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateService: (id: string, payload: Record<string, unknown>) =>
    apiRequest<{ service: any }>(`/api/services/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteService: (id: string) =>
    apiRequest<{ message: string }>(`/api/services/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  createBarber: (payload: Record<string, unknown>) =>
    apiRequest<{ barber: any }>("/api/barbers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateBarber: (id: string, payload: Record<string, unknown>) =>
    apiRequest<{ barber: any }>(`/api/barbers/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteBarber: (id: string) =>
    apiRequest<{ message: string }>(`/api/barbers/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Admin
  getUsers: () => apiRequest<{ users: any[] }>("/api/admin/users"),
  lockUser: (id: number, locked: boolean) =>
    apiRequest<{ user: any }>(`/api/admin/users/${id}/lock`, {
      method: "PATCH",
      body: JSON.stringify({ locked }),
    }),
  manageSalon: (id: number, payload: { verified?: boolean; status?: "active" | "hidden" }) =>
    apiRequest<{ salon: any }>(`/api/admin/salons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createCategory: (name: string, description: string) =>
    apiRequest<{ category: any }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  deleteCategory: (id: string) =>
    apiRequest<{ message: string }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Vouchers
  getVouchers: () => apiRequest<{ vouchers: any[] }>("/api/vouchers"),
  validateVoucher: (payload: { code: string; salonId: number; subtotal: number }) =>
    apiRequest<{ valid: boolean; voucher: any; discountAmount: number; finalPrice: number }>(
      "/api/vouchers/validate",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  // Notifications
  getNotifications: () =>
    apiRequest<{ notifications: any[]; unreadCount: number }>("/api/notifications"),
  markAllNotificationsRead: () =>
    apiRequest<{ ok: boolean }>("/api/notifications/read-all", { method: "PATCH" }),
  markNotificationRead: (id: string) =>
    apiRequest<{ notification: any }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
    }),
};
