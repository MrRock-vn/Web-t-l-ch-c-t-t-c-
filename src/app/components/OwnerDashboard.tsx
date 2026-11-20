import { useState } from "react";
import {
  Store,
  Scissors,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { localTodayISO, localDateISO } from "../lib/api";

export function OwnerDashboard() {
  const {
    currentUser,
    salons,
    services,
    barbers,
    bookings,
    reviews,
    categories,
    updateSalonInfo,
    saveService,
    deleteService,
    saveBarber,
    deleteBarber,
    updateBookingStatus,
    replyToReview,
    setActiveView,
  } = useApp();

  // Phân tách dữ liệu theo Salon của Owner (Mục 1.4 Báo cáo)
  const ownerSalonId = currentUser?.salonId || 1;
  const mySalon = salons.find((s) => s.id === ownerSalonId) || salons[0];

  const [tab, setTab] = useState<
    "bookings" | "services" | "barbers" | "reviews" | "revenue" | "salon-info"
  >("bookings");
  const [bookingViewMode, setBookingViewMode] = useState<"list" | "timeline">("list");
  const [timelineDate, setTimelineDate] = useState<string>(localTodayISO());
  const [alert, setAlert] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Salon Info state
  const [salonForm, setSalonForm] = useState({
    name: mySalon?.name || "",
    address: mySalon?.address || "",
    phone: mySalon?.phone || "",
    openHours: mySalon?.openHours || "08:00 - 20:30",
    description: mySalon?.description || "",
    open: mySalon?.open ?? true,
  });

  // New Service state
  const [svcForm, setSvcForm] = useState({
    name: "",
    price: 100000,
    duration: 45,
    categoryId: "cat-1",
    desc: "",
  });

  // New Barber state
  const [barberForm, setBarberForm] = useState({
    name: "",
    title: "Senior Barber · 5 năm",
    workStart: "08:00",
    workEnd: "20:00",
    dayOff: "Thứ Hai",
  });

  // Reply state
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  if (!mySalon) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", color: "#8A8178" }}>
        Đang tải dữ liệu cơ sở Salon...
      </div>
    );
  }

  const myBookings = bookings.filter((b) => b.salonId === mySalon.id);
  const myServices = services.filter((s) => s.salonId === mySalon.id || mySalon.id === 1);
  const myBarbers = barbers.filter((b) => b.salonId === mySalon.id);
  const myReviews = reviews.filter((r) => r.salonId === mySalon.id && !r.hidden);

  const completedBookings = myBookings.filter((b) => b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const confirmedRevenue = myBookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const handleSaveSalon = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalonInfo(mySalon.id, salonForm);
    setAlert({ type: "ok", text: "Đã cập nhật thông tin cơ sở Salon thành công!" });
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.name.trim()) return;
    saveService({
      salonId: mySalon.id,
      name: svcForm.name,
      price: Number(svcForm.price),
      duration: Number(svcForm.duration),
      categoryId: svcForm.categoryId,
      desc: svcForm.desc || "Dịch vụ chăm sóc chuyên sâu tại salon.",
      active: true,
    });
    setSvcForm({ name: "", price: 100000, duration: 45, categoryId: "cat-1", desc: "" });
    setAlert({ type: "ok", text: "Đã thêm dịch vụ mới vào thực đơn của Salon!" });
  };

  const handleDeleteService = async (id: string) => {
    const res = await deleteService(id);
    if (!res.ok) {
      setAlert({ type: "err", text: res.error || "Không thể xóa dịch vụ." });
    } else {
      setAlert({ type: "ok", text: "Đã xóa dịch vụ thành công." });
    }
  };

  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberForm.name.trim()) return;
    saveBarber({
      salonId: mySalon.id,
      name: barberForm.name,
      title: barberForm.title,
      workStart: barberForm.workStart,
      workEnd: barberForm.workEnd,
      daysOff: barberForm.dayOff ? [barberForm.dayOff] : [],
      active: true,
    });
    setBarberForm({
      name: "",
      title: "Senior Barber · 5 năm",
      workStart: "08:00",
      workEnd: "20:00",
      dayOff: "Thứ Hai",
    });
    setAlert({ type: "ok", text: "Đã thêm nhân viên và cấu hình ca làm việc!" });
  };

  return (
    <section style={{ backgroundColor: "#F6F1E7", minHeight: "100vh", padding: "104px 24px 72px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: "#14110F",
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 28,
            border: "1px solid rgba(200,146,59,0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  backgroundColor: "rgba(200,146,59,0.16)",
                  border: "1px solid rgba(200,146,59,0.4)",
                  color: "#C8923B",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 100,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Use Case 2.7 · Chủ Salon (Owner)
              </span>
              <span style={{ fontSize: 12, color: "#8A8178" }}>
                Phân tách dữ liệu cơ sở: #{mySalon.id}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30,
                fontWeight: 700,
                color: "#F6F1E7",
                margin: 0,
              }}
            >
              Quản lý Salon:{" "}
              <span style={{ color: "#C8923B", fontStyle: "italic" }}>{mySalon.name}</span>
            </h1>
          </div>

          <button
            onClick={() => setActiveView("landing")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(246,241,231,0.08)",
              border: "1px solid rgba(200,146,59,0.35)",
              color: "#F6F1E7",
              padding: "10px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} /> Về giao diện Khách hàng
          </button>
        </div>

        {alert && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderRadius: 12,
              marginBottom: 20,
              backgroundColor:
                alert.type === "ok" ? "rgba(110,139,116,0.16)" : "rgba(181,72,58,0.14)",
              border: `1px solid ${
                alert.type === "ok" ? "rgba(110,139,116,0.4)" : "rgba(181,72,58,0.4)"
              }`,
              color: alert.type === "ok" ? "#2F5B37" : "#B5483A",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {alert.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            <span style={{ flex: 1 }}>{alert.text}</span>
            <button
              onClick={() => setAlert(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { id: "bookings", label: `Xử lý Booking (${myBookings.length})`, icon: Calendar },
            { id: "services", label: `Quản lý Dịch vụ (${myServices.length})`, icon: Scissors },
            { id: "barbers", label: `Quản lý Nhân viên (${myBarbers.length})`, icon: Users },
            { id: "reviews", label: `Phản hồi Đánh giá (${myReviews.length})`, icon: MessageSquare },
            { id: "revenue", label: "Doanh thu & Thống kê", icon: TrendingUp },
            { id: "salon-info", label: "Thông tin cơ sở", icon: Store },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setAlert(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 12,
                  border: `1.5px solid ${active ? "#C8923B" : "rgba(31,26,23,0.12)"}`,
                  backgroundColor: active ? "#C8923B" : "#FDFAF4",
                  color: active ? "#14110F" : "#1F1A17",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BOOKINGS */}
        {tab === "bookings" && (
          <div
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              border: "1px solid rgba(31,26,23,0.08)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, margin: 0 }}>
                Danh sách Lịch hẹn của {mySalon.name}
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {bookingViewMode === "timeline" && (
                  <input
                    type="date"
                    value={timelineDate}
                    onChange={(e) => setTimelineDate(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", fontSize: 13 }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setBookingViewMode("list")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(31,26,23,0.15)",
                    backgroundColor: bookingViewMode === "list" ? "#C8923B" : "#fff",
                    color: "#14110F",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Danh sách
                </button>
                <button
                  type="button"
                  onClick={() => setBookingViewMode("timeline")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(31,26,23,0.15)",
                    backgroundColor: bookingViewMode === "timeline" ? "#C8923B" : "#fff",
                    color: "#14110F",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Lịch biểu theo thợ
                </button>
              </div>
            </div>

            {bookingViewMode === "timeline" ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(200,146,59,0.12)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", border: "1px solid rgba(31,26,23,0.08)" }}>
                        Khung giờ
                      </th>
                      {myBarbers.map((b) => (
                        <th
                          key={b.id}
                          style={{ padding: "10px 12px", textAlign: "left", border: "1px solid rgba(31,26,23,0.08)" }}
                        >
                          {b.shortName || b.name}
                          <div style={{ fontSize: 11, fontWeight: 400, color: "#8A8178" }}>
                            {b.workStart}–{b.workEnd}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map(
                      (hour) => (
                        <tr key={hour}>
                          <td
                            style={{
                              padding: "8px 12px",
                              fontWeight: 700,
                              color: "#57504A",
                              border: "1px solid rgba(31,26,23,0.08)",
                              backgroundColor: "#fff",
                              width: 86,
                            }}
                          >
                            {hour}
                          </td>
                          {myBarbers.map((b) => {
                            const hNum = parseInt(hour.slice(0, 2), 10);
                            const matched = myBookings.find(
                              (bk) =>
                                bk.barberId === b.id &&
                                bk.date === timelineDate &&
                                bk.status !== "cancelled" &&
                                parseInt(bk.time.slice(0, 2), 10) === hNum
                            );
                            return (
                              <td
                                key={b.id}
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid rgba(31,26,23,0.08)",
                                  backgroundColor: matched
                                    ? matched.status === "completed"
                                      ? "rgba(110,139,116,0.18)"
                                      : "rgba(200,146,59,0.2)"
                                    : "#fff",
                                }}
                              >
                                {matched ? (
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#14110F" }}>
                                      {matched.time} · {matched.customerName}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#57504A" }}>
                                      {matched.serviceNames} ({matched.status})
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: "rgba(138,129,120,0.45)", fontSize: 11 }}>Trống</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myBookings.map((bk) => (
                <div
                  key={bk.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(31,26,23,0.09)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#14110F" }}>
                      [{bk.id}] Khách: {bk.customerName} ({bk.customerPhone})
                    </div>
                    <div style={{ fontSize: 13, color: "#57504A", marginTop: 4 }}>
                      Dịch vụ: <strong>{bk.serviceNames}</strong> · Thợ: <strong>{bk.barberName}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: "#8A8178", marginTop: 2 }}>
                      Thời gian: {bk.date} lúc {bk.time} · Tổng:{" "}
                      <strong style={{ color: "#C8923B" }}>
                        {bk.totalPrice.toLocaleString("vi-VN")}₫
                      </strong>{" "}
                      ({bk.paymentMethod.toUpperCase()} - {bk.paymentStatus})
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: 100,
                        backgroundColor: "rgba(200,146,59,0.14)",
                        color: "#14110F",
                      }}
                    >
                      Trạng thái: {bk.status}
                    </span>
                    {bk.status === "pending" && (
                      <button
                        onClick={() => updateBookingStatus(bk.id, "confirmed")}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: "#C8923B",
                          color: "#14110F",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Xác nhận lịch
                      </button>
                    )}
                    {(bk.status === "pending" || bk.status === "confirmed") && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(bk.id, "completed")}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: "#6E8B74",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Hoàn thành
                        </button>
                        <button
                          onClick={() => updateBookingStatus(bk.id, "cancelled")}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(181,72,58,0.4)",
                            backgroundColor: "transparent",
                            color: "#B5483A",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICES */}
        {tab === "services" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24 }}>
            <form
              onSubmit={handleAddService}
              style={{
                backgroundColor: "#FDFAF4",
                borderRadius: 18,
                border: "1px solid rgba(31,26,23,0.08)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                height: "fit-content",
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 }}>
                Thêm dịch vụ mới
              </h3>
              <input
                type="text"
                required
                placeholder="Tên dịch vụ (VD: Gội đầu dưỡng sinh)"
                value={svcForm.name}
                onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              />
              <select
                value={svcForm.categoryId}
                onChange={(e) => setSvcForm({ ...svcForm, categoryId: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Giá (VNĐ)</label>
                  <input
                    type="number"
                    required
                    value={svcForm.price}
                    onChange={(e) => setSvcForm({ ...svcForm, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Thời lượng (phút)</label>
                  <input
                    type="number"
                    required
                    value={svcForm.duration}
                    onChange={(e) => setSvcForm({ ...svcForm, duration: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <textarea
                rows={2}
                placeholder="Mô tả dịch vụ..."
                value={svcForm.desc}
                onChange={(e) => setSvcForm({ ...svcForm, desc: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              />
              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#C8923B",
                  color: "#14110F",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> Thêm dịch vụ
              </button>
            </form>

            <div
              style={{
                backgroundColor: "#FDFAF4",
                borderRadius: 18,
                border: "1px solid rgba(31,26,23,0.08)",
                padding: 24,
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 14 }}>
                Danh sách Dịch vụ hiện có
              </h3>
              <p style={{ fontSize: 12, color: "#8A8178", marginBottom: 16 }}>
                * Quy tắc Ngoại lệ 2.7.1: Hệ thống tự động chặn xóa dịch vụ đang có lịch hẹn hoạt động.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myServices.map((svc) => (
                  <div
                    key={svc.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      backgroundColor: "#fff",
                      border: "1px solid rgba(31,26,23,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {svc.name}{" "}
                        {!svc.active && (
                          <span style={{ color: "#B5483A", fontSize: 11 }}>(Tạm ngừng)</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#C8923B", fontWeight: 700 }}>
                        {svc.price.toLocaleString("vi-VN")}₫ · {svc.duration} phút
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() =>
                          saveService({
                            ...svc,
                            active: !svc.active,
                          })
                        }
                        style={{
                          padding: "7px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(31,26,23,0.2)",
                          background: "#F6F1E7",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {svc.active ? "Tạm ngừng" : "Mở lại"}
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc.id)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(181,72,58,0.3)",
                          background: "rgba(181,72,58,0.08)",
                          color: "#B5483A",
                          cursor: "pointer",
                        }}
                        title="Xóa dịch vụ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BARBERS & SCHEDULE */}
        {tab === "barbers" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24 }}>
            <form
              onSubmit={handleAddBarber}
              style={{
                backgroundColor: "#FDFAF4",
                borderRadius: 18,
                border: "1px solid rgba(31,26,23,0.08)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                height: "fit-content",
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 }}>
                Thêm Nhân viên & Lịch làm việc
              </h3>
              <input
                type="text"
                required
                placeholder="Họ và tên thợ (VD: Đỗ Hoàng Nam)"
                value={barberForm.name}
                onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              />
              <input
                type="text"
                placeholder="Chức danh & Kinh nghiệm"
                value={barberForm.title}
                onChange={(e) => setBarberForm({ ...barberForm, title: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Giờ bắt đầu ca</label>
                  <input
                    type="time"
                    value={barberForm.workStart}
                    onChange={(e) => setBarberForm({ ...barberForm, workStart: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Giờ kết thúc ca</label>
                  <input
                    type="time"
                    value={barberForm.workEnd}
                    onChange={(e) => setBarberForm({ ...barberForm, workEnd: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Ngày nghỉ định kỳ</label>
                <select
                  value={barberForm.dayOff}
                  onChange={(e) => setBarberForm({ ...barberForm, dayOff: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", marginTop: 4 }}
                >
                  <option value="">Không nghỉ cố định</option>
                  {["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#C8923B",
                  color: "#14110F",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Lưu nhân viên
              </button>
            </form>

            <div
              style={{
                backgroundColor: "#FDFAF4",
                borderRadius: 18,
                border: "1px solid rgba(31,26,23,0.08)",
                padding: 24,
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16 }}>
                Đội ngũ Nhân viên thuộc {mySalon.name}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myBarbers.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      backgroundColor: "#fff",
                      border: "1px solid rgba(31,26,23,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "#8A8178" }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: "#C8923B", fontWeight: 600, marginTop: 4 }}>
                        Ca làm: {b.workStart} – {b.workEnd} · Ngày nghỉ:{" "}
                        {b.daysOff.length > 0 ? b.daysOff.join(", ") : "Làm cả tuần"}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const res = await deleteBarber(b.id);
                        if (!res.ok) setAlert({ type: "err", text: res.error || "Lỗi xóa" });
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(181,72,58,0.3)",
                        background: "rgba(181,72,58,0.08)",
                        color: "#B5483A",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS & OWNER REPLY */}
        {tab === "reviews" && (
          <div
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              border: "1px solid rgba(31,26,23,0.08)",
              padding: 24,
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 16 }}>
              Đánh giá khách hàng & Phản hồi công khai
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myReviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "18px",
                    borderRadius: 14,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(31,26,23,0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong>
                      {r.name} · <span style={{ color: "#C8923B" }}>{"★".repeat(r.rating)}</span>
                    </strong>
                    <span style={{ fontSize: 12, color: "#8A8178" }}>{r.date}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#1F1A17", margin: "6px 0 12px" }}>"{r.text}"</p>
                  {r.ownerReply && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        backgroundColor: "rgba(200,146,59,0.1)",
                        fontSize: 13,
                        marginBottom: 10,
                      }}
                    >
                      <strong>Phản hồi hiện tại của Salon:</strong> {r.ownerReply}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Nhập nội dung phản hồi khách hàng..."
                      value={replyTexts[r.id] ?? r.ownerReply ?? ""}
                      onChange={(e) => setReplyTexts({ ...replyTexts, [r.id]: e.target.value })}
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(31,26,23,0.2)",
                      }}
                    />
                    <button
                      onClick={() => {
                        replyToReview(r.id, replyTexts[r.id] ?? "");
                        setAlert({ type: "ok", text: "Đã đăng phản hồi công khai dưới đánh giá!" });
                      }}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: "#C8923B",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Gửi phản hồi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REVENUE STATS */}
        {tab === "revenue" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            <div
              style={{
                backgroundColor: "#14110F",
                color: "#F6F1E7",
                padding: 24,
                borderRadius: 18,
                border: "1px solid rgba(200,146,59,0.3)",
              }}
            >
              <div style={{ fontSize: 12, color: "#C8923B", textTransform: "uppercase", fontWeight: 700 }}>
                Doanh thu đã hoàn thành
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#C8923B",
                  marginTop: 8,
                }}
              >
                {totalRevenue.toLocaleString("vi-VN")}₫
              </div>
              <div style={{ fontSize: 13, color: "#8A8178", marginTop: 6 }}>
                Từ {completedBookings.length} lịch hẹn hoàn thành
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FDFAF4",
                padding: 24,
                borderRadius: 18,
                border: "1px solid rgba(31,26,23,0.08)",
              }}
            >
              <div style={{ fontSize: 12, color: "#8A8178", textTransform: "uppercase", fontWeight: 700 }}>
                Doanh thu dự kiến (Đã xác nhận)
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#14110F",
                  marginTop: 8,
                }}
              >
                {confirmedRevenue.toLocaleString("vi-VN")}₫
              </div>
              <div style={{ fontSize: 13, color: "#8A8178", marginTop: 6 }}>
                Tổng số lịch hẹn của cơ sở: {myBookings.length}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FDFAF4",
                padding: 24,
                borderRadius: 18,
                border: "1px solid rgba(31,26,23,0.08)",
              }}
            >
              <div style={{ fontSize: 12, color: "#8A8178", textTransform: "uppercase", fontWeight: 700 }}>
                Điểm đánh giá trung bình
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#C8923B",
                  marginTop: 8,
                }}
              >
                {mySalon.rating} ★
              </div>
              <div style={{ fontSize: 13, color: "#8A8178", marginTop: 6 }}>
                Tổng {mySalon.reviews} đánh giá từ khách hàng
              </div>
            </div>

            {/* Biểu đồ doanh thu 7 ngày gần nhất */}
            {(() => {
              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const iso = localDateISO(d);
                const amount = myBookings
                  .filter((b) => b.date === iso && b.status !== "cancelled")
                  .reduce((s, b) => s + b.totalPrice, 0);
                return {
                  iso,
                  label: iso.slice(5).split("-").reverse().join("/"),
                  amount,
                };
              });
              const maxVal = Math.max(100000, ...last7Days.map((x) => x.amount));
              return (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "#FDFAF4",
                    padding: 24,
                    borderRadius: 16,
                    border: "1px solid rgba(31,26,23,0.08)",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#14110F", marginBottom: 16 }}>
                    Biểu đồ doanh thu 7 ngày gần nhất ({mySalon.name})
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: 12,
                      alignItems: "end",
                      height: 180,
                      paddingTop: 20,
                    }}
                  >
                    {last7Days.map((d) => {
                      const pct = Math.max(6, Math.round((d.amount / maxVal) * 100));
                      return (
                        <div
                          key={d.iso}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            height: "100%",
                            justifyContent: "flex-end",
                            gap: 6,
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: d.amount > 0 ? "#C8923B" : "#8A8178" }}>
                            {d.amount > 0 ? `${Math.round(d.amount / 1000)}k` : "0"}
                          </div>
                          <div
                            style={{
                              width: "100%",
                              maxWidth: 44,
                              height: `${pct}%`,
                              borderRadius: "8px 8px 4px 4px",
                              background:
                                d.amount > 0
                                  ? "linear-gradient(180deg, #C8923B 0%, #9E6E24 100%)"
                                  : "rgba(31,26,23,0.08)",
                              transition: "height 300ms ease",
                            }}
                          />
                          <div style={{ fontSize: 11, color: "#57504A", fontWeight: 600 }}>{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 6: SALON INFO */}
        {tab === "salon-info" && (
          <form
            onSubmit={handleSaveSalon}
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              border: "1px solid rgba(31,26,23,0.08)",
              padding: 28,
              maxWidth: 680,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, margin: 0 }}>
              Cập nhật thông tin Salon
            </h3>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Tên Salon</label>
              <input
                type="text"
                value={salonForm.name}
                onChange={(e) => setSalonForm({ ...salonForm, name: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", marginTop: 4, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Địa chỉ</label>
                <input
                  type="text"
                  value={salonForm.address}
                  onChange={(e) => setSalonForm({ ...salonForm, address: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", marginTop: 4, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Giờ hoạt động</label>
                <input
                  type="text"
                  value={salonForm.openHours}
                  onChange={(e) => setSalonForm({ ...salonForm, openHours: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", marginTop: 4, boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Mô tả giới thiệu</label>
              <textarea
                rows={3}
                value={salonForm.description}
                onChange={(e) => setSalonForm({ ...salonForm, description: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", marginTop: 4, boxSizing: "border-box" }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={salonForm.open}
                onChange={(e) => setSalonForm({ ...salonForm, open: e.target.checked })}
              />
              Đang mở cửa nhận lịch hẹn trực tuyến
            </label>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                backgroundColor: "#C8923B",
                color: "#14110F",
                fontWeight: 700,
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              Lưu thông tin cơ sở
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

