import { X, Star, MapPin, Phone, Clock, CheckCircle2, User, Scissors } from "lucide-react";
import { useApp } from "../context/AppContext";

export function SalonDetailModal() {
  const {
    detailSalon,
    setDetailSalon,
    services,
    barbers,
    reviews,
    setSelectedSalonIdForBooking,
    setActiveView,
  } = useApp();

  if (!detailSalon) return null;

  const salonServices = services.filter((s) => s.active);
  const salonBarbers = barbers.filter((b) => b.salonId === detailSalon.id && b.active);
  const displayBarbers = salonBarbers.length > 0 ? salonBarbers : barbers.slice(0, 2);
  const salonReviews = reviews.filter((r) => !r.hidden && r.salonId === detailSalon.id);

  const handleBookSalon = () => {
    setSelectedSalonIdForBooking(detailSalon.id);
    setDetailSalon(null);
    setActiveView("landing");
    setTimeout(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        backgroundColor: "rgba(20,17,15,0.84)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => setDetailSalon(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#FDFAF4",
          borderRadius: 20,
          border: "1px solid rgba(200,146,59,0.28)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Banner image */}
        <div style={{ position: "relative", height: 220, backgroundColor: "#14110F" }}>
          <img
            src={detailSalon.photo}
            alt={detailSalon.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(20,17,15,0.95), rgba(20,17,15,0.2))",
            }}
          />
          <button
            onClick={() => setDetailSalon(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 38,
              height: 38,
              borderRadius: "50%",
              backgroundColor: "rgba(20,17,15,0.8)",
              border: "1px solid rgba(200,146,59,0.3)",
              color: "#F6F1E7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>

          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  backgroundColor: detailSalon.open ? "#6E8B74" : "#8A8178",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 100,
                }}
              >
                {detailSalon.open ? "Đang mở cửa" : "Đã đóng cửa"}
              </span>
              {detailSalon.verified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(200,146,59,0.2)",
                    border: "1px solid #C8923B",
                    color: "#C8923B",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  <CheckCircle2 size={12} /> Đã xác minh
                </span>
              )}
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#F6F1E7",
                margin: 0,
              }}
            >
              {detailSalon.name}
            </h2>
          </div>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {/* Meta info */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              paddingBottom: 18,
              marginBottom: 18,
              borderBottom: "1px solid rgba(31,26,23,0.08)",
              fontSize: 13,
              color: "#1F1A17",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color="#C8923B" /> {detailSalon.address}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Phone size={14} color="#C8923B" /> {detailSalon.phone}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color="#C8923B" /> {detailSalon.openHours}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <Star size={14} fill="#C8923B" color="#C8923B" /> {detailSalon.rating} ({detailSalon.reviews} đánh giá)
            </span>
          </div>

          <p style={{ fontSize: 14, color: "#57504A", lineHeight: 1.65, marginBottom: 24 }}>
            {detailSalon.description}
          </p>

          {/* Salon Services */}
          <h4
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#14110F",
              marginBottom: 12,
            }}
          >
            Bảng giá dịch vụ tại {detailSalon.name}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {salonServices.map((svc) => (
              <div
                key={svc.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  backgroundColor: "#F6F1E7",
                  border: "1px solid rgba(31,26,23,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#14110F" }}>{svc.name}</div>
                  <div style={{ fontSize: 12, color: "#8A8178" }}>{svc.duration} phút</div>
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#C8923B",
                  }}
                >
                  {svc.price.toLocaleString("vi-VN")}₫
                </div>
              </div>
            ))}
          </div>

          {/* Salon Barbers */}
          <h4
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#14110F",
              marginBottom: 12,
            }}
          >
            Đội ngũ Barber thuộc {detailSalon.name}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
            {displayBarbers.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(31,26,23,0.1)",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    backgroundColor: "rgba(200,146,59,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} color="#C8923B" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#14110F" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "#8A8178" }}>
                    Ca: {b.workStart} - {b.workEnd}
                  </div>
                  <div style={{ fontSize: 11, color: "#C8923B", fontWeight: 600 }}>★ {b.rating}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews of this salon */}
          {salonReviews.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#14110F",
                  marginBottom: 10,
                }}
              >
                Đánh giá gần đây ({salonReviews.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {salonReviews.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "#F6F1E7",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                      <span>{r.name}</span>
                      <span style={{ color: "#C8923B" }}>{"★".repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: "6px 0 0", color: "#57504A" }}>"{r.text}"</p>
                    {r.ownerReply && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 10px",
                          borderRadius: 8,
                          backgroundColor: "rgba(200,146,59,0.1)",
                          fontSize: 12,
                          color: "#14110F",
                        }}
                      >
                        <strong>Phản hồi từ Chủ Salon:</strong> {r.ownerReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              onClick={() => setDetailSalon(null)}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid rgba(31,26,23,0.2)",
                background: "transparent",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
            <button
              onClick={handleBookSalon}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                backgroundColor: "#C8923B",
                color: "#14110F",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Scissors size={16} /> Đặt lịch tại {detailSalon.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

