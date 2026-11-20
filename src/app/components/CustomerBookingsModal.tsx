import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  CreditCard,
  Star,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useApp, BookingStatus } from "../context/AppContext";
import { api, localTodayISO } from "../lib/api";

const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending: { label: "Chờ xác nhận", bg: "rgba(200,146,59,0.14)", color: "#A9722A" },
  confirmed: { label: "Đã xác nhận", bg: "rgba(59,130,246,0.12)", color: "#1D4ED8" },
  completed: { label: "Đã hoàn thành", bg: "rgba(110,139,116,0.18)", color: "#2F5B37" },
  cancelled: { label: "Đã hủy", bg: "rgba(181,72,58,0.14)", color: "#B5483A" },
};

export function CustomerBookingsModal() {
  const {
    myBookingsOpen,
    setMyBookingsOpen,
    bookings,
    cancelBooking,
    rescheduleBooking,
    payWithVnpaySandbox,
    requestRefund,
    submitReview,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Reschedule modal state (đồng bộ khung giờ trống thật từ /api/salons/:id/availability)
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(localTodayISO());
  const [newTime, setNewTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);

  const editingBooking = bookings.find((b) => b.id === editingBookingId) || null;

  useEffect(() => {
    if (!editingBooking || !newDate) {
      setRescheduleSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingRescheduleSlots(true);
    api
      .getAvailability(editingBooking.salonId, {
        barberId: editingBooking.barberId,
        date: newDate,
        duration: editingBooking.totalDuration || 30,
      })
      .then((res) => {
        if (cancelled) return;
        const slots = Array.from(
          new Set((res.availability || []).flatMap((a) => a.slots || []))
        );
        setRescheduleSlots(slots);
        setNewTime((prev) => (prev && slots.includes(prev) ? prev : slots[0] || ""));
      })
      .catch(() => {
        if (!cancelled) {
          setRescheduleSlots([]);
          setNewTime("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRescheduleSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editingBooking?.id, editingBooking?.salonId, editingBooking?.barberId, editingBooking?.totalDuration, newDate]);

  // Review form state
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  if (!myBookingsOpen) return null;

  const list = bookings.filter((b) => filterStatus === "all" || b.status === filterStatus);

  const handleCancel = async (id: string) => {
    const res = await cancelBooking(id);
    setNotice({ type: res.ok ? "ok" : "err", text: res.message });
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookingId) return;
    const res = await rescheduleBooking(editingBookingId, newDate, newTime);
    if (!res.ok) {
      setNotice({ type: "err", text: res.error || "Không thể đổi lịch." });
      return;
    }
    setNotice({ type: "ok", text: `Đã đổi lịch hẹn ${editingBookingId} sang ${newTime} ngày ${newDate}.` });
    setEditingBookingId(null);
  };

  const handleVnpayPay = async (id: string) => {
    const res = await payWithVnpaySandbox(id);
    if (res.ok) {
      setNotice({
        type: "ok",
        text: `Thanh toán VNPay Sandbox thành công! Mã GD: ${res.txnRef} · Chữ ký số: ${res.signature}`,
      });
    } else if (res.error) {
      setNotice({ type: "err", text: res.error });
    }
  };

  const handleRefund = async (id: string) => {
    const res = await requestRefund(id);
    setNotice({ type: res.ok ? "ok" : "err", text: res.message });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId) return;
    const res = await submitReview({
      bookingId: reviewBookingId,
      rating,
      text: reviewText,
      photoUrl,
    });
    if (!res.ok) {
      setNotice({ type: "err", text: res.error || "Gửi đánh giá thất bại." });
      return;
    }
    setNotice({
      type: "ok",
      text: "Đã gửi đánh giá thành công! Điểm trung bình của Salon đã được cập nhật.",
    });
    setReviewBookingId(null);
    setReviewText("");
    setPhotoUrl("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 98,
        backgroundColor: "rgba(20,17,15,0.84)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => setMyBookingsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#FDFAF4",
          borderRadius: 20,
          border: "1px solid rgba(200,146,59,0.28)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#14110F",
            padding: "22px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(200,146,59,0.2)",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: "#C8923B",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Use Case 2.4 · 2.5 · 2.6
            </span>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: "#F6F1E7",
                marginTop: 4,
              }}
            >
              Quản lý lịch hẹn & Thanh toán của tôi
            </h3>
          </div>
          <button
            onClick={() => setMyBookingsOpen(false)}
            style={{
              background: "rgba(246,241,231,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 38,
              height: 38,
              color: "#F6F1E7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {notice && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                marginBottom: 18,
                backgroundColor:
                  notice.type === "ok" ? "rgba(110,139,116,0.14)" : "rgba(181,72,58,0.12)",
                border: `1px solid ${
                  notice.type === "ok" ? "rgba(110,139,116,0.4)" : "rgba(181,72,58,0.35)"
                }`,
                color: notice.type === "ok" ? "#2F5B37" : "#B5483A",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {notice.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ flex: 1 }}>{notice.text}</span>
              <button
                onClick={() => setNotice(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Status filter tabs (Chuẩn hóa 4 trạng thái Mục 1.2.4) */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { id: "all", label: "Tất cả lịch hẹn" },
              { id: "pending", label: "Chờ xác nhận" },
              { id: "confirmed", label: "Đã xác nhận" },
              { id: "completed", label: "Đã hoàn thành" },
              { id: "cancelled", label: "Đã hủy" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: "7px 15px",
                  borderRadius: 100,
                  border: `1.5px solid ${
                    filterStatus === f.id ? "#C8923B" : "rgba(31,26,23,0.14)"
                  }`,
                  backgroundColor: filterStatus === f.id ? "#C8923B" : "transparent",
                  color: filterStatus === f.id ? "#14110F" : "#1F1A17",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Booking cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {list.map((bk) => {
              const st = STATUS_META[bk.status];
              return (
                <div
                  key={bk.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    border: "1px solid rgba(31,26,23,0.1)",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#14110F",
                          marginRight: 10,
                        }}
                      >
                        {bk.salonName}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#C8923B",
                          backgroundColor: "rgba(200,146,59,0.1)",
                          padding: "3px 9px",
                          borderRadius: 6,
                        }}
                      >
                        Mã: {bk.id}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span
                        style={{
                          backgroundColor: st.bg,
                          color: st.color,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "4px 12px",
                          borderRadius: 100,
                        }}
                      >
                        {st.label}
                      </span>
                      <span
                        style={{
                          backgroundColor:
                            bk.paymentStatus === "paid"
                              ? "rgba(110,139,116,0.15)"
                              : bk.paymentStatus === "refund_requested"
                              ? "rgba(200,146,59,0.2)"
                              : bk.paymentStatus === "refunded"
                              ? "rgba(59,130,246,0.15)"
                              : "rgba(31,26,23,0.08)",
                          color: "#14110F",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 100,
                        }}
                      >
                        {bk.paymentStatus === "paid"
                          ? `Đã TT (${bk.paymentMethod === "vnpay" ? "VNPay" : "Tại quầy"})`
                          : bk.paymentStatus === "refund_requested"
                          ? "Chờ duyệt hoàn tiền"
                          : bk.paymentStatus === "refunded"
                          ? "Đã hoàn tiền VNPay"
                          : "Chưa thanh toán"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: 10,
                      fontSize: 13,
                      color: "#57504A",
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "#F6F1E7",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <strong>Dịch vụ:</strong> {bk.serviceNames}
                    </div>
                    <div>
                      <strong>Thợ cắt:</strong> {bk.barberName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={13} color="#C8923B" /> {bk.date} lúc {bk.time} ({bk.totalDuration}p)
                    </div>
                    <div>
                      <strong>Tổng tiền:</strong>{" "}
                      <span style={{ color: "#C8923B", fontWeight: 700 }}>
                        {bk.totalPrice.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>

                  {/* Actions per Use Cases 2.4, 2.5, 2.6 */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {(bk.status === "pending" || bk.status === "confirmed") && (
                      <>
                        <button
                          onClick={() => {
                            setEditingBookingId(bk.id);
                            setNewDate(bk.date);
                            setNewTime(bk.time);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(31,26,23,0.2)",
                            backgroundColor: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <RefreshCw size={13} /> Đổi lịch hẹn
                        </button>
                        <button
                          onClick={() => handleCancel(bk.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(181,72,58,0.35)",
                            backgroundColor: "rgba(181,72,58,0.08)",
                            color: "#B5483A",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <XCircle size={13} /> Hủy lịch hẹn
                        </button>
                      </>
                    )}

                    {bk.paymentStatus === "unpaid" && bk.status !== "cancelled" && (
                      <button
                        onClick={() => handleVnpayPay(bk.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
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
                        <CreditCard size={13} /> Thanh toán qua ví VNPay
                      </button>
                    )}

                    {bk.paymentStatus === "paid" &&
                      bk.paymentMethod === "vnpay" &&
                      bk.status !== "completed" && (
                        <button
                          onClick={() => handleRefund(bk.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(200,146,59,0.4)",
                            backgroundColor: "rgba(200,146,59,0.1)",
                            color: "#14110F",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Yêu cầu hoàn tiền VNPay
                        </button>
                      )}

                    {bk.status === "completed" && !bk.reviewed && (
                      <button
                        onClick={() => setReviewBookingId(bk.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: "#C8923B",
                          color: "#14110F",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Star size={13} /> Viết đánh giá dịch vụ
                      </button>
                    )}
                  </div>

                  {/* Inline Reschedule Form (lấy khung giờ trống thật từ server) */}
                  {editingBookingId === bk.id && (
                    <form
                      onSubmit={handleReschedule}
                      style={{
                        marginTop: 14,
                        padding: "16px",
                        borderRadius: 10,
                        backgroundColor: "rgba(200,146,59,0.08)",
                        border: "1px solid rgba(200,146,59,0.25)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Chọn ngày mới:</span>
                        <input
                          type="date"
                          min={localTodayISO()}
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
                        />
                        <span style={{ fontSize: 12, color: "#8A8178" }}>
                          Thợ: <strong>{bk.barberName}</strong> · Thời lượng: {bk.totalDuration} phút
                        </span>
                      </div>

                      {loadingRescheduleSlots ? (
                        <div style={{ fontSize: 13, color: "#8A8178" }}>
                          Đang kiểm tra khung giờ trống của thợ...
                        </div>
                      ) : rescheduleSlots.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#B5483A", fontWeight: 500 }}>
                          Không còn khung giờ trống vào ngày {newDate} (thợ nghỉ hoặc đã kín lịch). Vui lòng chọn ngày khác.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {rescheduleSlots.map((t) => {
                            const active = newTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setNewTime(t)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 999,
                                  border: `1.5px solid ${active ? "#C8923B" : "rgba(31,26,23,0.2)"}`,
                                  backgroundColor: active ? "#C8923B" : "#fff",
                                  color: active ? "#14110F" : "#1F1A17",
                                  fontWeight: active ? 700 : 500,
                                  fontSize: 13,
                                  cursor: "pointer",
                                }}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="submit"
                          disabled={!newTime || loadingRescheduleSlots}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: !newTime || loadingRescheduleSlots ? "rgba(31,26,23,0.12)" : "#C8923B",
                            color: !newTime || loadingRescheduleSlots ? "#8A8178" : "#14110F",
                            fontWeight: 700,
                            cursor: !newTime || loadingRescheduleSlots ? "not-allowed" : "pointer",
                          }}
                        >
                          Lưu lịch mới {newTime ? `(${newTime})` : ""}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBookingId(null)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(31,26,23,0.2)",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Inline Write Review Form (Use Case 2.6) */}
                  {reviewBookingId === bk.id && (
                    <form
                      onSubmit={handleReviewSubmit}
                      style={{
                        marginTop: 14,
                        padding: "16px",
                        borderRadius: 12,
                        backgroundColor: "#F6F1E7",
                        border: "1px solid rgba(200,146,59,0.3)",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                        Đánh giá trải nghiệm tại {bk.salonName} (Thợ: {bk.barberName})
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Chọn số sao:</span>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 18,
                              color: s <= rating ? "#C8923B" : "#ccc",
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm dịch vụ, tay nghề thợ cắt..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(31,26,23,0.2)",
                          marginBottom: 8,
                          boxSizing: "border-box",
                        }}
                      />
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Link ảnh kiểu tóc sau khi cắt (tùy chọn)..."
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(31,26,23,0.2)",
                          marginBottom: 10,
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="submit"
                          style={{
                            padding: "9px 18px",
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: "#C8923B",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Gửi đánh giá
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewBookingId(null)}
                          style={{
                            padding: "9px 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(31,26,23,0.2)",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Đóng
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

