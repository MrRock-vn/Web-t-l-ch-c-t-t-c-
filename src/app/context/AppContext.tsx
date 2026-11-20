import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getAuthToken, setAuthToken } from "../lib/api";

export type UserRole = "customer" | "owner" | "admin";

export interface UserDoc {
  _id?: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  salonId?: number;
  address?: string;
  birthDate?: string;
  title?: string;
  status: "active" | "locked";
}

export interface CategoryDoc {
  _id?: string;
  id: string;
  name: string;
  description: string;
}

export interface SalonDoc {
  _id?: string;
  id: number;
  name: string;
  district: string;
  address: string;
  phone: string;
  description: string;
  rating: number;
  reviews: number;
  priceFrom: number;
  tags: string[];
  verified: boolean;
  open: boolean;
  status: "active" | "hidden";
  openHours: string;
  photo: string;
  booked: number;
  ownerId: number;
}

export interface ServiceDoc {
  _id?: string;
  id: string;
  salonId: number;
  categoryId: string;
  name: string;
  desc: string;
  price: number;
  duration: number;
  active: boolean;
}

export interface BarberDoc {
  _id?: string;
  id: string;
  salonId: number;
  name: string;
  shortName: string;
  title: string;
  salon: string;
  rating: number;
  reviews: number;
  specialties: string[];
  photo: string;
  verified: boolean;
  workStart: string;
  workEnd: string;
  daysOff: string[];
  active: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refund_requested" | "refunded";

export interface BookingDoc {
  _id?: string;
  id: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  salonId: number;
  salonName: string;
  serviceIds: string[];
  serviceNames: string;
  barberId: string;
  barberName: string;
  date: string;
  time: string;
  totalDuration: number;
  totalPrice: number;
  paymentMethod: "counter" | "vnpay";
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  note: string;
  reviewed: boolean;
  createdAt: string;
}

export interface PaymentDoc {
  _id?: string;
  id: string;
  bookingId: string;
  customerId: number;
  amount: number;
  method: "counter" | "vnpay";
  vnpTxnRef: string;
  vnpSignature: string;
  status: "pending" | "paid" | "refund_requested" | "refunded" | "failed";
  paidAt?: string;
}

export interface ReviewDoc {
  _id?: string;
  id: string;
  bookingId: string;
  customerId: number;
  name: string;
  date: string;
  createdAt: string;
  rating: number;
  text: string;
  photoUrl?: string;
  service: string;
  barber: string;
  avatar: string;
  salonId: number;
  salon: string;
  ownerReply: string;
  reported: boolean;
  reportReason: string;
  hidden: boolean;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface VoucherDoc {
  code: string;
  title: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  salonId: number | null;
  active: boolean;
}

export interface NotificationDoc {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: "booking" | "payment" | "system";
  read: boolean;
  createdAt: string;
}

interface AppContextType {
  currentUser: UserDoc | null;
  users: UserDoc[];
  categories: CategoryDoc[];
  salons: SalonDoc[];
  services: ServiceDoc[];
  barbers: BarberDoc[];
  bookings: BookingDoc[];
  payments: PaymentDoc[];
  reviews: ReviewDoc[];
  vouchers: VoucherDoc[];
  notifications: NotificationDoc[];
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  // Search & Booking selection state
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  selectedDistrictFilter: string;
  setSelectedDistrictFilter: (v: string) => void;
  selectedServiceFilter: string;
  setSelectedServiceFilter: (v: string) => void;
  selectedSalonIdForBooking: number;
  setSelectedSalonIdForBooking: (id: number) => void;
  preselectedServiceId: string | null;
  setPreselectedServiceId: (id: string | null) => void;
  preselectedBarberId: string | null;
  setPreselectedBarberId: (id: string | null) => void;

  // Modals & Active View
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalInitialTab: "login" | "register" | "profile";
  openAuthModal: (tab?: "login" | "register" | "profile") => void;
  myBookingsOpen: boolean;
  setMyBookingsOpen: (open: boolean) => void;
  detailSalon: SalonDoc | null;
  setDetailSalon: (salon: SalonDoc | null) => void;
  activeView: "landing" | "owner" | "admin";
  setActiveView: (v: "landing" | "owner" | "admin") => void;

  // Global Toast Notifications
  toasts: ToastItem[];
  showToast: (type: ToastItem["type"], message: string) => void;
  dismissToast: (id: string) => void;

  // Auth Actions
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  quickLoginRole: (role: UserRole) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "customer" | "owner";
    address?: string;
    birthDate?: string;
    salonName?: string;
    district?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (payload: { name: string; phone: string; address: string; birthDate: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;

  // Booking & Payment Actions
  createBooking: (payload: {
    salonId: number;
    serviceIds: string[];
    barberId: string;
    date: string;
    time: string;
    customerName: string;
    customerPhone: string;
    note: string;
    paymentMethod: "counter" | "vnpay";
    voucherCode?: string;
  }) => Promise<{ ok: boolean; error?: string; booking?: BookingDoc }>;
  cancelBooking: (bookingId: string) => Promise<{ ok: boolean; message: string }>;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string) => Promise<{ ok: boolean; error?: string }>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  payWithVnpaySandbox: (bookingId: string) => Promise<{ ok: boolean; txnRef: string; signature: string; error?: string }>;
  requestRefund: (bookingId: string) => Promise<{ ok: boolean; message: string }>;

  // Review Actions
  submitReview: (payload: {
    bookingId: string;
    rating: number;
    text: string;
    photoUrl?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  editReview: (reviewId: string, rating: number, text: string) => Promise<{ ok: boolean; error?: string }>;
  reportReview: (reviewId: string, reason: string) => Promise<void>;
  replyToReview: (reviewId: string, replyText: string) => Promise<void>;

  // Owner Actions
  updateSalonInfo: (salonId: number, updates: Partial<SalonDoc>) => Promise<void>;
  saveService: (service: Partial<ServiceDoc> & { name: string; price: number; duration: number; salonId: number }) => Promise<void>;
  deleteService: (serviceId: string) => Promise<{ ok: boolean; error?: string }>;
  saveBarber: (barber: Partial<BarberDoc> & { name: string; salonId: number }) => Promise<void>;
  deleteBarber: (barberId: string) => Promise<{ ok: boolean; error?: string }>;

  // Admin Actions
  toggleUserLock: (targetUserId: number) => Promise<{ ok: boolean; error?: string }>;
  toggleSalonStatus: (salonId: number, field: "verified" | "status") => Promise<void>;
  addCategory: (name: string, description: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<{ ok: boolean; error?: string }>;
  moderateReview: (reviewId: string, action: "keep" | "hide" | "delete") => Promise<void>;
  processRefundAdmin: (bookingId: string, approve: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const DEV_QUICK_ACCOUNTS: Record<UserRole, { email: string; password: string }> = {
  customer: { email: "khachhang@barberspa.vn", password: "123456" },
  owner: { email: "owner@barberspa.vn", password: "owner123" },
  admin: { email: "admin@barberspa.vn", password: "admin123" },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserDoc | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [salons, setSalons] = useState<SalonDoc[]>([]);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [barbers, setBarbers] = useState<BarberDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [vouchers, setVouchers] = useState<VoucherDoc[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Filters & Selections
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState("Tất cả");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("Tất cả dịch vụ");
  const [selectedSalonIdForBooking, setSelectedSalonIdForBooking] = useState<number>(1);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [preselectedBarberId, setPreselectedBarberId] = useState<string | null>(null);

  // Modals & Navigation View
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<"login" | "register" | "profile">("login");
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [detailSalon, setDetailSalon] = useState<SalonDoc | null>(null);
  const [activeView, setActiveView] = useState<"landing" | "owner" | "admin">("landing");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastItem["type"], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadPublicData = useCallback(async () => {
    try {
      const [salonsRes, servicesRes, barbersRes, categoriesRes, reviewsRes, vouchersRes] = await Promise.all([
        api.getSalons(),
        api.getServices(),
        api.getBarbers(),
        api.getCategories(),
        api.getReviews(),
        api.getVouchers().catch(() => ({ vouchers: [] })),
      ]);
      setSalons(salonsRes.salons || []);
      setServices(servicesRes.services || []);
      setBarbers(barbersRes.barbers || []);
      setCategories(categoriesRes.categories || []);
      setReviews(reviewsRes.reviews || []);
      setVouchers(vouchersRes.vouchers || []);
    } catch {
      // Backend may be starting up
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadNotificationCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationCount(0);
    } catch {
      // ignore
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadNotificationCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const loadPrivateData = useCallback(async (user: UserDoc | null) => {
    if (!user) {
      setBookings([]);
      setPayments([]);
      setUsers([]);
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const [bookingsRes, paymentsRes, notiRes] = await Promise.all([
        api.getMyBookings(),
        api.getPayments(),
        api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);
      setBookings(bookingsRes.bookings || []);
      setPayments(paymentsRes.payments || []);
      setNotifications(notiRes.notifications || []);
      setUnreadNotificationCount(notiRes.unreadCount || 0);

      if (user.role === "admin") {
        const [usersRes, salonsRes, reviewsRes] = await Promise.all([
          api.getUsers(),
          api.getSalons(),
          api.getReviews(),
        ]);
        setUsers(usersRes.users || []);
        setSalons(salonsRes.salons || []);
        setReviews(reviewsRes.reviews || []);
      }
    } catch {
      // Token expired or unauthorized
    }
  }, []);

  // Initial load: public catalog + restore session via JWT
  useEffect(() => {
    loadPublicData();
    const token = getAuthToken();
    if (token) {
      api
        .me()
        .then(({ user }) => {
          setCurrentUser(user);
          loadPrivateData(user);
        })
        .catch(() => {
          setAuthToken(null);
          setCurrentUser(null);
        });
    }
  }, [loadPublicData, loadPrivateData]);

  const openAuthModal = (tab: "login" | "register" | "profile" = "login") => {
    setAuthModalInitialTab(tab);
    setAuthModalOpen(true);
  };

  const applyLoggedInUser = async (user: UserDoc, token: string) => {
    setAuthToken(token);
    setCurrentUser(user);
    if (user.role === "owner") setActiveView("owner");
    else if (user.role === "admin") setActiveView("admin");
    else setActiveView("landing");
    await loadPrivateData(user);
  };

  const login: AppContextType["login"] = async (email, password) => {
    try {
      const { user, token } = await api.login(email, password);
      await applyLoggedInUser(user, token);
      showToast("success", `Chào mừng ${user.name} đã đăng nhập!`);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Đăng nhập thất bại." };
    }
  };

  // Chỉ giữ làm tiện ích demo nhanh ở môi trường dev — vẫn gọi POST /api/auth/login thật để nhận JWT
  const quickLoginRole = async (role: UserRole) => {
    const creds = DEV_QUICK_ACCOUNTS[role];
    const res = await login(creds.email, creds.password);
    if (res.ok) {
      setAuthModalOpen(false);
    }
  };

  const register: AppContextType["register"] = async (payload) => {
    try {
      const { user, token } = await api.register(payload);
      await applyLoggedInUser(user, token);
      await loadPublicData();
      showToast("success", "Đăng ký tài khoản mới thành công!");
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Đăng ký thất bại." };
    }
  };

  const updateProfile: AppContextType["updateProfile"] = async (payload) => {
    try {
      const { user } = await api.updateProfile(payload);
      setCurrentUser(user);
      showToast("success", "Đã cập nhật hồ sơ cá nhân.");
    } catch (err: any) {
      showToast("error", err?.message || "Cập nhật hồ sơ thất bại.");
    }
  };

  const changePassword: AppContextType["changePassword"] = async (currentPassword, newPassword) => {
    try {
      await api.changePassword(currentPassword, newPassword);
      showToast("success", "Đổi mật khẩu thành công!");
      return { ok: true };
    } catch (err: any) {
      const msg = err?.message || "Đổi mật khẩu thất bại.";
      showToast("error", msg);
      return { ok: false, error: msg };
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setAuthToken(null);
    setCurrentUser(null);
    setBookings([]);
    setPayments([]);
    setUsers([]);
    setActiveView("landing");
    showToast("info", "Bạn đã đăng xuất khỏi hệ thống.");
  };

  const createBooking: AppContextType["createBooking"] = async (payload) => {
    if (!currentUser) {
      openAuthModal("login");
      showToast("info", "Vui lòng đăng nhập để hoàn tất đặt lịch.");
      return { ok: false, error: "Vui lòng đăng nhập để đặt lịch hẹn." };
    }
    try {
      const { booking } = await api.createBooking(payload);
      let finalBooking = booking;

      // Nếu khách chọn thanh toán VNPay: ở chế độ demo (VNP_SIMULATE=true) gọi callback mô phỏng;
      // ở môi trường thật (production) chuyển hướng sang cổng VNPay chính thức
      if (payload.paymentMethod === "vnpay") {
        const payInit = await api.createVnpayPayment(booking.id);
        if (payInit.simulateReturnUrl) {
          const verified = await api.verifyVnpayReturn(payInit.simulateReturnUrl);
          if (verified.booking) finalBooking = verified.booking;
          if (verified.payment) setPayments((prev) => [verified.payment, ...prev]);
        } else if (payInit.paymentUrl) {
          window.open(payInit.paymentUrl, "_blank", "noopener,noreferrer");
        }
      }

      setBookings((prev) => [finalBooking, ...prev]);
      refreshNotifications();
      showToast("success", `Đặt lịch thành công! Mã lịch hẹn: ${finalBooking.id}`);
      return { ok: true, booking: finalBooking };
    } catch (err: any) {
      const msg = err?.message || "Không thể tạo lịch hẹn.";
      showToast("error", msg);
      return { ok: false, error: msg };
    }
  };

  const cancelBooking: AppContextType["cancelBooking"] = async (bookingId) => {
    try {
      const { booking } = await api.cancelBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? booking : b)));
      showToast("success", `Đã hủy lịch hẹn ${bookingId}.`);
      return { ok: true, message: "Đã hủy lịch hẹn thành công." };
    } catch (err: any) {
      const msg = err?.message || "Không thể hủy lịch hẹn.";
      showToast("error", msg);
      return { ok: false, message: msg };
    }
  };

  const rescheduleBooking: AppContextType["rescheduleBooking"] = async (bookingId, newDate, newTime) => {
    try {
      const { booking } = await api.rescheduleBooking(bookingId, newDate, newTime);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? booking : b)));
      showToast("success", `Đã đổi lịch ${bookingId} sang ${newTime} ngày ${newDate}.`);
      return { ok: true };
    } catch (err: any) {
      const msg = err?.message || "Không thể đổi lịch hẹn.";
      showToast("error", msg);
      return { ok: false, error: msg };
    }
  };

  const updateBookingStatus: AppContextType["updateBookingStatus"] = async (bookingId, status) => {
    try {
      const { booking } = await api.updateBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? booking : b)));
      showToast("success", `Đã cập nhật lịch ${bookingId} sang trạng thái "${status}".`);
    } catch (err: any) {
      showToast("error", err?.message || "Không thể cập nhật trạng thái lịch hẹn.");
    }
  };

  const payWithVnpaySandbox: AppContextType["payWithVnpaySandbox"] = async (bookingId) => {
    try {
      const { paymentUrl, simulateReturnUrl, payment } = await api.createVnpayPayment(bookingId);
      if (!simulateReturnUrl) {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
        return {
          ok: true,
          txnRef: payment.vnpTxnRef,
          signature: "ĐÃ CHUYỂN SANG CỔNG VNPAY",
        };
      }
      const verified = await api.verifyVnpayReturn(simulateReturnUrl);
      if (verified.booking) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? verified.booking : b)));
      }
      if (verified.payment) {
        setPayments((prev) => [verified.payment, ...prev.filter((p) => p.id !== verified.payment.id)]);
      }
      return {
        ok: true,
        txnRef: payment.vnpTxnRef,
        signature: String(payment.vnpSignature).slice(0, 24).toUpperCase(),
      };
    } catch (err: any) {
      return { ok: false, txnRef: "", signature: "", error: err?.message || "Thanh toán VNPay thất bại." };
    }
  };

  const requestRefund: AppContextType["requestRefund"] = async (bookingId) => {
    try {
      const { booking, payment } = await api.requestRefund(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? booking : b)));
      if (payment) {
        setPayments((prev) => prev.map((p) => (p.bookingId === bookingId ? payment : p)));
      }
      return { ok: true, message: "Đã gửi yêu cầu hoàn tiền VNPay. Quản trị viên sẽ xét duyệt." };
    } catch (err: any) {
      return { ok: false, message: err?.message || "Không thể gửi yêu cầu hoàn tiền." };
    }
  };

  const submitReview: AppContextType["submitReview"] = async (payload) => {
    try {
      const { review } = await api.createReview(payload);
      setReviews((prev) => [review, ...prev]);
      setBookings((prev) =>
        prev.map((b) => (b.id === payload.bookingId ? { ...b, reviewed: true } : b))
      );
      await loadPublicData(); // Refresh recalculated salon/barber ratings from server
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Gửi đánh giá thất bại." };
    }
  };

  const editReview: AppContextType["editReview"] = async (reviewId, rating, text) => {
    try {
      const { review } = await api.updateReview(reviewId, { rating, text });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? review : r)));
      await loadPublicData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Cập nhật đánh giá thất bại." };
    }
  };

  const reportReview: AppContextType["reportReview"] = async (reviewId, reason) => {
    try {
      const { review } = await api.reportReview(reviewId, reason);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? review : r)));
    } catch {
      // ignore
    }
  };

  const replyToReview: AppContextType["replyToReview"] = async (reviewId, replyText) => {
    try {
      const { review } = await api.replyReview(reviewId, replyText);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? review : r)));
    } catch {
      // ignore
    }
  };

  const updateSalonInfo: AppContextType["updateSalonInfo"] = async (salonId, updates) => {
    try {
      const { salon } = await api.updateSalon(salonId, updates);
      setSalons((prev) => prev.map((s) => (s.id === salonId ? salon : s)));
    } catch {
      // ignore
    }
  };

  const saveService: AppContextType["saveService"] = async (svc) => {
    try {
      if (svc.id && services.some((s) => s.id === svc.id)) {
        const { service } = await api.updateService(svc.id, svc);
        setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
      } else {
        const { service } = await api.createService({
          ...svc,
          categoryId: svc.categoryId || "cat-1",
        });
        setServices((prev) => [...prev, service]);
      }
    } catch {
      // ignore
    }
  };

  const deleteService: AppContextType["deleteService"] = async (serviceId) => {
    try {
      await api.deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Không thể xóa dịch vụ." };
    }
  };

  const saveBarber: AppContextType["saveBarber"] = async (barberInput) => {
    try {
      if (barberInput.id && barbers.some((b) => b.id === barberInput.id)) {
        const { barber } = await api.updateBarber(barberInput.id, barberInput);
        setBarbers((prev) => prev.map((b) => (b.id === barber.id ? barber : b)));
      } else {
        const { barber } = await api.createBarber(barberInput);
        setBarbers((prev) => [...prev, barber]);
      }
    } catch {
      // ignore
    }
  };

  const deleteBarber: AppContextType["deleteBarber"] = async (barberId) => {
    try {
      await api.deleteBarber(barberId);
      setBarbers((prev) => prev.filter((b) => b.id !== barberId));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Không thể xóa nhân viên." };
    }
  };

  const toggleUserLock: AppContextType["toggleUserLock"] = async (targetUserId) => {
    const target = users.find((u) => u.id === targetUserId);
    const nextLocked = target ? target.status === "active" : true;
    try {
      const { user } = await api.lockUser(targetUserId, nextLocked);
      setUsers((prev) => prev.map((u) => (u.id === targetUserId ? user : u)));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Không thể thay đổi trạng thái tài khoản." };
    }
  };

  const toggleSalonStatus: AppContextType["toggleSalonStatus"] = async (salonId, field) => {
    const target = salons.find((s) => s.id === salonId);
    if (!target) return;
    const payload =
      field === "verified"
        ? { verified: !target.verified }
        : { status: target.status === "active" ? ("hidden" as const) : ("active" as const) };
    try {
      const { salon } = await api.manageSalon(salonId, payload);
      setSalons((prev) => prev.map((s) => (s.id === salonId ? salon : s)));
    } catch {
      // ignore
    }
  };

  const addCategory: AppContextType["addCategory"] = async (name, description) => {
    if (!name.trim()) return;
    try {
      const { category } = await api.createCategory(name.trim(), description.trim());
      setCategories((prev) => [...prev, category]);
    } catch {
      // ignore
    }
  };

  const deleteCategory: AppContextType["deleteCategory"] = async (categoryId) => {
    try {
      await api.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Không thể xóa danh mục." };
    }
  };

  const moderateReview: AppContextType["moderateReview"] = async (reviewId, action) => {
    try {
      const res = await api.moderateReview(reviewId, action);
      if (action === "delete") {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else if (res.review) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? res.review : r)));
      }
      await loadPublicData();
    } catch {
      // ignore
    }
  };

  const processRefundAdmin: AppContextType["processRefundAdmin"] = async (bookingId, approve) => {
    try {
      const { booking, payment } = await api.processRefundAdmin(
        bookingId,
        approve ? "approve" : "reject"
      );
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? booking : b)));
      if (payment) {
        setPayments((prev) => prev.map((p) => (p.bookingId === bookingId ? payment : p)));
      }
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        categories,
        salons,
        services,
        barbers,
        bookings,
        payments,
        reviews,
        vouchers,
        notifications,
        unreadNotificationCount,
        refreshNotifications,
        markAllNotificationsRead,
        markNotificationRead,
        searchKeyword,
        setSearchKeyword,
        selectedDistrictFilter,
        setSelectedDistrictFilter,
        selectedServiceFilter,
        setSelectedServiceFilter,
        selectedSalonIdForBooking,
        setSelectedSalonIdForBooking,
        preselectedServiceId,
        setPreselectedServiceId,
        preselectedBarberId,
        setPreselectedBarberId,
        authModalOpen,
        setAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
        myBookingsOpen,
        setMyBookingsOpen,
        detailSalon,
        setDetailSalon,
        activeView,
        setActiveView,
        toasts,
        showToast,
        dismissToast,
        login,
        quickLoginRole,
        register,
        updateProfile,
        changePassword,
        logout,
        createBooking,
        cancelBooking,
        rescheduleBooking,
        updateBookingStatus,
        payWithVnpaySandbox,
        requestRefund,
        submitReview,
        editReview,
        reportReview,
        replyToReview,
        updateSalonInfo,
        saveService,
        deleteService,
        saveBarber,
        deleteBarber,
        toggleUserLock,
        toggleSalonStatus,
        addCategory,
        deleteCategory,
        moderateReview,
        processRefundAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
