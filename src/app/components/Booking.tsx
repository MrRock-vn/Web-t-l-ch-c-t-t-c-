import { useState, useEffect } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  CreditCard,
  Scissors,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api, localDateISO } from "../lib/api";

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    date: d,
    label:
      i === 0
        ? "Hôm nay"
        : i === 1
        ? "Ngày mai"
        : d.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          }),
    key: localDateISO(d),
  };
});

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

const STEP_LABELS = ["Salon & Dịch vụ", "Thợ cắt", "Ngày & Giờ", "Xác nhận"];

export function Booking() {
  const {
    currentUser,
    salons,
    services,
    barbers,
    bookings,
    vouchers,
    selectedSalonIdForBooking,
    setSelectedSalonIdForBooking,
    preselectedServiceId,
    setPreselectedServiceId,
    preselectedBarberId,
    setPreselectedBarberId,
    createBooking,
    setMyBookingsOpen,
    showToast,
  } = useApp();

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState(DATES[0].key);
  const [selectedTime, setSelectedTime] = useState("");
  const [countdown, setCountdown] = useState(600);
  const [payment, setPayment] = useState<"counter" | "vnpay">("counter");
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    note: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [createdBookingCode, setCreatedBookingCode] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [findingNearest, setFindingNearest] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || currentUser.name,
        phone: prev.phone || currentUser.phone,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServices((prev) =>
        prev.includes(preselectedServiceId) ? prev : [...prev, preselectedServiceId]
      );
      setPreselectedServiceId(null);
    }
  }, [preselectedServiceId, setPreselectedServiceId]);

  useEffect(() => {
    if (preselectedBarberId) {
      setSelectedBarber(preselectedBarberId);
      setPreselectedBarberId(null);
    }
  }, [preselectedBarberId, setPreselectedBarberId]);

  useEffect(() => {
    if (step === 3 && selectedTime) {
      const id = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
      return () => clearInterval(id);
    }
  }, [step, selectedTime]);

  const activeSalons = salons.filter((s) => s.status === "active");
  const chosenSalon =
    activeSalons.find((s) => s.id === selectedSalonIdForBooking) || activeSalons[0];

  const availableServices = services.filter(
    (s) => s.active && (!chosenSalon || s.salonId === chosenSalon.id)
  );

  // Lọc nhân viên thuộc đúng Salon được chọn (Quy tắc nghiệp vụ Mục 1.3.2 & 1.4)
  const salonBarbers = barbers.filter(
    (b) => b.salonId === chosenSalon?.id && b.active
  );
  const displayBarbers = [
    { id: "any", name: "Bất kỳ ai", title: "Thợ rảnh sớm nhất tại salon", rating: null as number | null },
    ...(salonBarbers.length > 0 ? salonBarbers : barbers).map((b) => ({
      id: b.id,
      name: b.shortName || b.name,
      title: `${b.title} (${b.workStart}-${b.workEnd})`,
      rating: b.rating,
    })),
  ];

  // Lấy khung giờ trống trực tiếp từ server (tính đủ ca làm, ngày nghỉ, lịch của mọi khách & thời lượng)
  const totalDurationForQuery = selectedServices.reduce((sum, id) => {
    const svc = availableServices.find((s) => s.id === id);
    return sum + (svc?.duration ?? 0);
  }, 0);

  useEffect(() => {
    if (!chosenSalon || !selectedBarber || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    api
      .getAvailability(chosenSalon.id, {
        barberId: selectedBarber,
        date: selectedDate,
        duration: totalDurationForQuery || 30,
      })
      .then((res) => {
        if (cancelled) return;
        const merged = Array.from(
          new Set((res.availability || []).flatMap((item) => item.slots || []))
        );
        setAvailableSlots(merged);
        if (selectedTime && !merged.includes(selectedTime)) {
          setSelectedTime("");
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chosenSalon?.id, selectedBarber, selectedDate, totalDurationForQuery, bookings.length]);

  const availableSlotSet = new Set(availableSlots);

  const handleFindNearestSlot = async () => {
    if (!chosenSalon || !selectedBarber) return;
    setFindingNearest(true);
    try {
      for (const d of DATES) {
        if (d.key === selectedDate) continue;
        const res = await api.getAvailability(chosenSalon.id, {
          barberId: selectedBarber,
          date: d.key,
          duration: totalDurationForQuery || 30,
        });
        const merged = Array.from(
          new Set((res.availability || []).flatMap((item) => item.slots || []))
        );
        if (merged.length > 0) {
          setSelectedDate(d.key);
          setSelectedTime(merged[0]);
          showToast("success", `Đã gợi ý lịch trống gần nhất: ${merged[0]} ngày ${d.key}`);
          return;
        }
      }
      showToast("info", "Không tìm thấy khung giờ trống trong 7 ngày tới. Bạn hãy thử chọn 'Bất kỳ ai'.");
    } finally {
      setFindingNearest(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalPrice = selectedServices.reduce((sum, id) => {
    const svc = availableServices.find((s) => s.id === id);
    return sum + (svc?.price ?? 0);
  }, 0);

  const totalDuration = selectedServices.reduce((sum, id) => {
    const svc = availableServices.find((s) => s.id === id);
    return sum + (svc?.duration ?? 0);
  }, 0);

  const canNext =
    (step === 1 && selectedServices.length > 0) ||
    (step === 2 && selectedBarber !== "") ||
    (step === 3 && selectedTime !== "") ||
    step === 4;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  const handleApplyVoucher = async (codeOverride?: string) => {
    const code = (codeOverride ?? voucherInput).trim().toUpperCase();
    setVoucherError("");
    if (!code) {
      setAppliedVoucher(null);
      return;
    }
    try {
      const res = await api.validateVoucher({
        code,
        salonId: chosenSalon?.id || 1,
        subtotal: totalPrice,
      });
      setVoucherInput(code);
      setAppliedVoucher({ code, discountAmount: res.discountAmount });
      showToast("success", `Áp dụng mã ${code} thành công (-${fmt(res.discountAmount)})!`);
    } catch (err: any) {
      setAppliedVoucher(null);
      setVoucherError(err?.message || "Mã giảm giá không hợp lệ.");
    }
  };

  const finalTotalPrice = Math.max(0, totalPrice - (appliedVoucher?.discountAmount || 0));

  const handleConfirmBooking = async () => {
    setBookingError("");
    if (!chosenSalon) return;
    if (!form.name.trim() || !form.phone.trim()) {
      setBookingError("Vui lòng nhập đầy đủ Họ tên và Số điện thoại liên hệ.");
      return;
    }
    const res = await createBooking({
      salonId: chosenSalon.id,
      serviceIds: selectedServices,
      barberId: selectedBarber,
      date: selectedDate,
      time: selectedTime,
      customerName: form.name,
      customerPhone: form.phone,
      note: form.note,
      paymentMethod: payment,
      voucherCode: appliedVoucher?.code || undefined,
    });
    if (!res.ok || !res.booking) {
      setBookingError(res.error || "Không thể đặt lịch. Vui lòng kiểm tra lại khung giờ.");
      return;
    }
    setCreatedBookingCode(res.booking.id);
  };

  if (!chosenSalon) {
    return (
      <section id="booking" style={{ backgroundColor: "#F6F1E7", padding: "96px 24px", textAlign: "center" }}>
        <p style={{ color: "#8A8178", fontSize: 15 }}>Đang tải danh sách cơ sở Salon & dịch vụ...</p>
      </section>
    );
  }

  if (createdBookingCode) {
    return (
      <section id="booking" style={{ backgroundColor: "#F6F1E7", padding: "96px 24px" }}>
        <div
          style={{
            maxWidth: 540,
            margin: "0 auto",
            textAlign: "center",
            padding: "60px 40px",
            backgroundColor: "#FDFAF4",
            borderRadius: 20,
            border: "1px solid rgba(31,26,23,0.08)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#6E8B74",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Check size={40} color="#fff" strokeWidth={2.5} />
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#14110F",
              marginBottom: 12,
            }}
          >
            Đặt lịch thành công!
          </h2>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 15,
              color: "#8A8178",
              lineHeight: 1.65,
              marginBottom: 24,
            }}
          >
            Cảm ơn bạn đã tin tưởng <strong>Barber Spa</strong> ({chosenSalon.name}).{" "}
            {payment === "vnpay"
              ? "Giao dịch thanh toán qua VNPay Sandbox đã được xác thực chữ ký thành công!"
              : "Lịch hẹn đã được ghi nhận ở trạng thái Chờ xác nhận."}
          </p>
          <div
            style={{
              backgroundColor: "rgba(200,146,59,0.08)",
              border: "1px solid rgba(200,146,59,0.2)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 28,
            }}
          >
            <p
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                color: "#8A8178",
                marginBottom: 4,
              }}
            >
              Mã đặt lịch (Lưu trong CSDL NoSQL)
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: "#C8923B",
                letterSpacing: "0.08em",
              }}
            >
              {createdBookingCode}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setMyBookingsOpen(true)}
              style={{
                backgroundColor: "#14110F",
                color: "#F6F1E7",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                border: "1px solid rgba(200,146,59,0.4)",
                borderRadius: 10,
                padding: "14px 24px",
                cursor: "pointer",
              }}
            >
              Xem trong Lịch hẹn của tôi
            </button>
            <button
              onClick={() => {
                setCreatedBookingCode(null);
                setStep(1);
                setSelectedServices([]);
                setSelectedBarber("");
                setSelectedTime("");
                setCountdown(600);
              }}
              style={{
                backgroundColor: "#C8923B",
                color: "#14110F",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                borderRadius: 10,
                padding: "14px 24px",
                cursor: "pointer",
              }}
            >
              Đặt lịch mới
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="booking"
      style={{
        backgroundColor: "#F6F1E7",
        padding: "96px 24px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 2, backgroundColor: "#C8923B" }} />
            <span
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#C8923B",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Đặt lịch trực tuyến
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "#14110F",
              lineHeight: 1.2,
            }}
          >
            Đặt lịch{" "}
            <span style={{ color: "#C8923B", fontStyle: "italic" }}>ngay hôm nay</span>
          </h2>
        </div>

        {/* Stepper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 48,
            overflowX: "auto",
          }}
        >
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: i < 3 ? 1 : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: done
                        ? "#6E8B74"
                        : active
                        ? "#C8923B"
                        : "rgba(31,26,23,0.1)",
                      border: `2px solid ${
                        done
                          ? "#6E8B74"
                          : active
                          ? "#C8923B"
                          : "rgba(31,26,23,0.15)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 300ms",
                    }}
                  >
                    {done ? (
                      <Check size={16} color="#fff" strokeWidth={2.5} />
                    ) : (
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: active ? "#14110F" : "#8A8178",
                        }}
                      >
                        {n}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: active ? "#14110F" : done ? "#6E8B74" : "#8A8178",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: done ? "#6E8B74" : "rgba(31,26,23,0.1)",
                      margin: "0 8px",
                      marginBottom: 20,
                      transition: "background-color 300ms",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {bookingError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "rgba(181,72,58,0.12)",
              border: "1px solid rgba(181,72,58,0.35)",
              color: "#B5483A",
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 20,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Step content */}
        <div
          style={{
            backgroundColor: "#FDFAF4",
            borderRadius: 20,
            border: "1px solid rgba(31,26,23,0.08)",
            padding: "36px",
            marginBottom: 28,
          }}
        >
          {/* Step 1: Salon & Services */}
          {step === 1 && (
            <div>
              {/* Salon selector */}
              <div
                style={{
                  backgroundColor: "rgba(200,146,59,0.08)",
                  border: "1px solid rgba(200,146,59,0.22)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 24,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={16} color="#C8923B" />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#C8923B", textTransform: "uppercase" }}>
                      Cơ sở Salon đang chọn
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#14110F" }}>
                      {chosenSalon.name} — {chosenSalon.address}
                    </div>
                  </div>
                </div>
                <select
                  value={chosenSalon.id}
                  onChange={(e) => {
                    setSelectedSalonIdForBooking(Number(e.target.value));
                    setSelectedServices([]);
                    setSelectedBarber("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(200,146,59,0.4)",
                    backgroundColor: "#FDFAF4",
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#14110F",
                    cursor: "pointer",
                  }}
                >
                  {activeSalons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#14110F",
                  marginBottom: 8,
                }}
              >
                Chọn dịch vụ
              </h3>
              <p
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 14,
                  color: "#8A8178",
                  marginBottom: 28,
                }}
              >
                Bạn có thể chọn nhiều dịch vụ cùng lúc.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {availableServices.map((svc) => {
                  const selected = selectedServices.includes(svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderRadius: 12,
                        border: `2px solid ${selected ? "#C8923B" : "rgba(31,26,23,0.08)"}`,
                        backgroundColor: selected ? "rgba(200,146,59,0.06)" : "#FDFAF4",
                        cursor: "pointer",
                        transition: "all 200ms",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${
                              selected ? "#C8923B" : "rgba(31,26,23,0.2)"
                            }`,
                            backgroundColor: selected ? "#C8923B" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 200ms",
                          }}
                        >
                          {selected && <Check size={13} color="#14110F" strokeWidth={2.5} />}
                        </div>
                        <div>
                          <div
                            style={{
                              fontFamily: "'Be Vietnam Pro', sans-serif",
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#14110F",
                            }}
                          >
                            {svc.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Be Vietnam Pro', sans-serif",
                              fontSize: 12,
                              color: "#8A8178",
                              marginTop: 2,
                            }}
                          >
                            {svc.duration} phút
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#C8923B",
                        }}
                      >
                        {fmt(svc.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {selectedServices.length > 0 && (
                <div
                  style={{
                    marginTop: 24,
                    padding: "14px 20px",
                    backgroundColor: "rgba(200,146,59,0.08)",
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 16 }}>
                    <span
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 14,
                        color: "#8A8178",
                      }}
                    >
                      {selectedServices.length} dịch vụ · {totalDuration} phút
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#C8923B",
                    }}
                  >
                    {fmt(totalPrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Barber */}
          {step === 2 && (
            <div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#14110F",
                  marginBottom: 8,
                }}
              >
                Chọn thợ cắt tại {chosenSalon.name}
              </h3>
              <p
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 14,
                  color: "#8A8178",
                  marginBottom: 28,
                }}
              >
                Hệ thống chỉ hiển thị nhân viên thuộc đúng cơ sở {chosenSalon.name} (theo quy tắc Mục 1.3.2).
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                {displayBarbers.map((b) => {
                  const sel = selectedBarber === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBarber(b.id)}
                      style={{
                        padding: "18px 16px",
                        borderRadius: 12,
                        border: `2px solid ${sel ? "#C8923B" : "rgba(31,26,23,0.08)"}`,
                        backgroundColor: sel ? "rgba(200,146,59,0.06)" : "#FDFAF4",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 200ms",
                        position: "relative",
                      }}
                    >
                      {sel && (
                        <div style={{ position: "absolute", top: 8, right: 8 }}>
                          <Check size={14} color="#C8923B" />
                        </div>
                      )}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          backgroundColor: sel ? "#C8923B" : "rgba(31,26,23,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 12px",
                        }}
                      >
                        <User size={22} color={sel ? "#14110F" : "#8A8178"} />
                      </div>
                      <div
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#14110F",
                          marginBottom: 4,
                        }}
                      >
                        {b.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 12,
                          color: "#8A8178",
                        }}
                      >
                        {b.title}
                      </div>
                      {b.rating && (
                        <div
                          style={{
                            marginTop: 6,
                            fontFamily: "'Be Vietnam Pro', sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#C8923B",
                          }}
                        >
                          ★ {b.rating}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 28,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#14110F",
                      marginBottom: 4,
                    }}
                  >
                    Chọn ngày & giờ
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 14,
                      color: "#8A8178",
                    }}
                  >
                    Các khung giờ đã có khách đặt được khóa tự động để tránh trùng lịch.
                  </p>
                </div>
                {selectedTime && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor:
                        countdown < 120
                          ? "rgba(181,72,58,0.1)"
                          : "rgba(200,146,59,0.08)",
                      border: `1px solid ${
                        countdown < 120
                          ? "rgba(181,72,58,0.3)"
                          : "rgba(200,146,59,0.2)"
                      }`,
                      borderRadius: 100,
                      padding: "6px 14px",
                    }}
                  >
                    <Clock size={14} color={countdown < 120 ? "#B5483A" : "#C8923B"} />
                    <span
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: countdown < 120 ? "#B5483A" : "#C8923B",
                      }}
                    >
                      Giữ chỗ: {mins}:{secs.toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>

              {/* Date strip */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  paddingBottom: 4,
                  marginBottom: 28,
                }}
              >
                {DATES.map((d) => {
                  const sel = selectedDate === d.key;
                  return (
                    <button
                      key={d.key}
                      onClick={() => {
                        setSelectedDate(d.key);
                        setSelectedTime("");
                      }}
                      style={{
                        flexShrink: 0,
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: `2px solid ${sel ? "#C8923B" : "rgba(31,26,23,0.1)"}`,
                        backgroundColor: sel ? "#C8923B" : "transparent",
                        color: sel ? "#14110F" : "#1F1A17",
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 13,
                        fontWeight: sel ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 200ms",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              {/* Time slots (đồng bộ từ GET /api/salons/:id/availability) */}
              {loadingSlots ? (
                <div style={{ padding: "20px 0", color: "#8A8178", fontSize: 14 }}>
                  Đang kiểm tra khung giờ trống từ hệ thống...
                </div>
              ) : availableSlots.length === 0 ? (
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: 12,
                    backgroundColor: "rgba(181,72,58,0.08)",
                    border: "1px solid rgba(181,72,58,0.2)",
                    color: "#B5483A",
                    fontSize: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    Không còn khung giờ trống phù hợp cho ngày này (thợ nghỉ, ngoài giờ làm việc hoặc đã kín lịch).
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleFindNearestSlot}
                      disabled={findingNearest}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: "#C8923B",
                        color: "#14110F",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: findingNearest ? "wait" : "pointer",
                      }}
                    >
                      {findingNearest ? "Đang tìm ngày trống..." : "Chọn ngày gần nhất còn trống"}
                    </button>
                    {selectedBarber !== "any" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBarber("any");
                          setSelectedTime("");
                          showToast("info", "Đã chuyển sang chọn Bất kỳ thợ nào đang rảnh.");
                        }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid rgba(31,26,23,0.25)",
                          backgroundColor: "#FDFAF4",
                          color: "#14110F",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Chuyển sang Bất kỳ thợ nào
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {TIME_SLOTS.map((t) => {
                    const booked = !availableSlotSet.has(t);
                    const sel = selectedTime === t;
                    return (
                      <button
                        key={t}
                        onClick={() => !booked && setSelectedTime(t)}
                        disabled={booked}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 100,
                        border: `2px solid ${
                          booked
                            ? "rgba(31,26,23,0.08)"
                            : sel
                            ? "#C8923B"
                            : "rgba(200,146,59,0.3)"
                        }`,
                        backgroundColor: booked
                          ? "rgba(31,26,23,0.04)"
                          : sel
                          ? "#C8923B"
                          : "transparent",
                        color: booked ? "#8A8178" : sel ? "#14110F" : "#1F1A17",
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 14,
                        fontWeight: sel ? 700 : 500,
                        cursor: booked ? "not-allowed" : "pointer",
                        textDecoration: booked ? "line-through" : "none",
                        transition: "all 200ms",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#14110F",
                  marginBottom: 8,
                }}
              >
                Xác nhận & Thanh toán
              </h3>
              <p
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 14,
                  color: "#8A8178",
                  marginBottom: 28,
                }}
              >
                Kiểm tra thông tin và điền thông tin liên hệ.
              </p>

              {/* Summary */}
              <div
                style={{
                  backgroundColor: "rgba(200,146,59,0.06)",
                  border: "1px solid rgba(200,146,59,0.15)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#C8923B",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Tóm tắt đặt lịch
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Cơ sở Salon", value: `${chosenSalon.name} (${chosenSalon.district})` },
                    {
                      label: "Dịch vụ",
                      value: selectedServices
                        .map((id) => availableServices.find((s) => s.id === id)?.name)
                        .join(", "),
                    },
                    {
                      label: "Thợ cắt",
                      value: displayBarbers.find((b) => b.id === selectedBarber)?.name,
                    },
                    {
                      label: "Ngày",
                      value: DATES.find((d) => d.key === selectedDate)?.label,
                    },
                    { label: "Giờ", value: selectedTime },
                    { label: "Thời lượng", value: `${totalDuration} phút` },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 14,
                          color: "#8A8178",
                        }}
                      >
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1F1A17",
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      height: 1,
                      backgroundColor: "rgba(31,26,23,0.08)",
                      margin: "8px 0",
                    }}
                  />

                  {/* Mã giảm giá / Voucher */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá (VD: BARBER20)"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(31,26,23,0.18)",
                          backgroundColor: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyVoucher()}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: "#14110F",
                          color: "#F6F1E7",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Áp dụng
                      </button>
                    </div>
                    {vouchers.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {vouchers.slice(0, 3).map((v) => (
                          <button
                            key={v.code}
                            type="button"
                            onClick={() => handleApplyVoucher(v.code)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              border: `1px dashed ${appliedVoucher?.code === v.code ? "#2F5B37" : "#C8923B"}`,
                              backgroundColor:
                                appliedVoucher?.code === v.code
                                  ? "rgba(110,139,116,0.16)"
                                  : "rgba(200,146,59,0.08)",
                              color: appliedVoucher?.code === v.code ? "#2F5B37" : "#A9722A",
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {v.code} · {v.title}
                          </button>
                        ))}
                      </div>
                    )}
                    {voucherError && (
                      <div style={{ fontSize: 12, color: "#B5483A", fontWeight: 600 }}>{voucherError}</div>
                    )}
                  </div>

                  {appliedVoucher && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#2F5B37", fontWeight: 600 }}>
                      <span>Giảm giá ({appliedVoucher.code})</span>
                      <span>-{fmt(appliedVoucher.discountAmount)}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#14110F",
                      }}
                    >
                      Tổng cộng
                    </span>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#C8923B",
                      }}
                    >
                      {fmt(finalTotalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    label: "Họ và tên *",
                    key: "name",
                    placeholder: "Nguyễn Văn A",
                    type: "text",
                  },
                  {
                    label: "Số điện thoại *",
                    key: "phone",
                    placeholder: "0912 345 678",
                    type: "tel",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1F1A17",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1.5px solid rgba(31,26,23,0.15)",
                        backgroundColor: "#FDFAF4",
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 14,
                        color: "#14110F",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1F1A17",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Ghi chú
                </label>
                <textarea
                  placeholder="Yêu cầu đặc biệt, kiểu tóc muốn cắt..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(31,26,23,0.15)",
                    backgroundColor: "#FDFAF4",
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 14,
                    color: "#14110F",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Payment */}
              <div>
                <div
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1F1A17",
                    marginBottom: 12,
                  }}
                >
                  Phương thức thanh toán (Use Case 2.5)
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { id: "counter", label: "Thanh toán tại quầy", icon: Scissors },
                    { id: "vnpay", label: "Thanh toán VNPay (Sandbox)", icon: CreditCard },
                  ].map((p) => {
                    const Icon = p.icon;
                    const sel = payment === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPayment(p.id as "counter" | "vnpay")}
                        style={{
                          flex: 1,
                          minWidth: 160,
                          padding: "14px 16px",
                          borderRadius: 12,
                          border: `2px solid ${sel ? "#C8923B" : "rgba(31,26,23,0.1)"}`,
                          backgroundColor: sel
                            ? "rgba(200,146,59,0.06)"
                            : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          transition: "all 200ms",
                        }}
                      >
                        <Icon size={18} color={sel ? "#C8923B" : "#8A8178"} />
                        <span
                          style={{
                            fontFamily: "'Be Vietnam Pro', sans-serif",
                            fontSize: 14,
                            fontWeight: sel ? 700 : 500,
                            color: sel ? "#14110F" : "#8A8178",
                          }}
                        >
                          {p.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "transparent",
              border: "1.5px solid rgba(31,26,23,0.15)",
              borderRadius: 10,
              padding: "12px 20px",
              cursor: step === 1 ? "not-allowed" : "pointer",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: step === 1 ? "#8A8178" : "#1F1A17",
              transition: "all 200ms",
            }}
          >
            <ChevronLeft size={16} />
            Quay lại
          </button>

          {step < 4 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: canNext ? "#C8923B" : "rgba(31,26,23,0.1)",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                cursor: canNext ? "pointer" : "not-allowed",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: canNext ? "#14110F" : "#8A8178",
                transition: "all 200ms",
              }}
              onMouseEnter={(e) =>
                canNext && (e.currentTarget.style.backgroundColor = "#A9722A")
              }
              onMouseLeave={(e) =>
                canNext && (e.currentTarget.style.backgroundColor = "#C8923B")
              }
            >
              Tiếp theo
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleConfirmBooking}
              style={{
                backgroundColor:
                  form.name && form.phone ? "#C8923B" : "rgba(31,26,23,0.1)",
                border: "none",
                borderRadius: 10,
                padding: "12px 32px",
                cursor: form.name && form.phone ? "pointer" : "not-allowed",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: form.name && form.phone ? "#14110F" : "#8A8178",
                transition: "all 200ms",
              }}
            >
              Xác nhận đặt lịch
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
