import { Scissors, Wind, Droplets, Sparkles, Crown } from "lucide-react";
import { useApp } from "../context/AppContext";

const SERVICES_ROW1 = [
  {
    id: "cat-toc",
    icon: Scissors,
    name: "Cắt tóc",
    desc: "Tạo kiểu chuẩn theo khuôn mặt, bao gồm gội và sấy tạo kiểu hoàn chỉnh.",
    price: "80.000",
    duration: "45 phút",
  },
  {
    id: "uon-toc",
    icon: Droplets,
    name: "Uốn tóc",
    desc: "Uốn xoăn hoặc duỗi thẳng với sản phẩm cao cấp, dưỡng chất chuyên sâu.",
    price: "350.000",
    duration: "90 phút",
  },
  {
    id: "nhuom-toc",
    icon: Sparkles,
    name: "Nhuộm tóc",
    desc: "Nhuộm màu thời trang, highlight hoặc ombre theo xu hướng mới nhất.",
    price: "280.000",
    duration: "120 phút",
  },
  {
    id: "cao-rau",
    icon: Wind,
    name: "Cạo râu",
    desc: "Cạo râu truyền thống với dao cạo thẳng, khăn nóng và dầu dưỡng da.",
    price: "60.000",
    duration: "30 phút",
  },
];

export function Services() {
  const { setPreselectedServiceId } = useApp();

  const handleSelectService = (svcId: string) => {
    setPreselectedServiceId(svcId);
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="services"
      style={{ backgroundColor: "#F6F1E7", padding: "100px 24px 80px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section header */}
        <div
          style={{
            marginBottom: 52,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
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
                Dịch vụ
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(26px, 3.5vw, 42px)",
                fontWeight: 700,
                color: "#14110F",
                lineHeight: 1.2,
              }}
            >
              Dịch vụ <span style={{ color: "#C8923B", fontStyle: "italic" }}>chuyên nghiệp</span>
            </h2>
          </div>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 15,
              color: "#8A8178",
              maxWidth: 380,
              lineHeight: 1.65,
            }}
          >
            Mỗi dịch vụ được thực hiện bởi thợ lành nghề, sử dụng sản phẩm nhập khẩu chất lượng cao.
          </p>
        </div>

        {/* 4 regular service cards — equal height via grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 20,
            marginBottom: 20,
          }}
        >
          {SERVICES_ROW1.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.name}
                onClick={() => handleSelectService(svc.id)}
                style={{
                  backgroundColor: "#FDFAF4",
                  borderRadius: 16,
                  padding: "26px 24px 24px",
                  border: "1px solid rgba(31,26,23,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 250ms ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 28px rgba(200,146,59,0.11)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(200,146,59,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(31,26,23,0.08)";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "rgba(200,146,59,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <Icon size={22} color="#C8923B" strokeWidth={1.75} />
                </div>

                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#14110F",
                    marginBottom: 10,
                  }}
                >
                  {svc.name}
                </h3>

                <p
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 14,
                    color: "#8A8178",
                    lineHeight: 1.65,
                    flex: 1,
                  }}
                >
                  {svc.desc}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 16,
                    marginTop: 20,
                    borderTop: "1px solid rgba(31,26,23,0.07)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#C8923B",
                    }}
                  >
                    {svc.price}₫
                  </span>
                  <span
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      color: "#8A8178",
                      backgroundColor: "rgba(31,26,23,0.06)",
                      borderRadius: 100,
                      padding: "4px 12px",
                    }}
                  >
                    {svc.duration}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Combo VIP — full-width featured card */}
        <div
          style={{
            backgroundColor: "#1F1A17",
            borderRadius: 20,
            padding: "32px 36px",
            border: "1px solid rgba(200,146,59,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            position: "relative",
            overflow: "hidden",
            transition: "all 250ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(200,146,59,0.6)";
            e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(200,146,59,0.25)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* bg decoration */}
          <div
            style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              backgroundColor: "rgba(200,146,59,0.05)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 20,
              top: -20,
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "1px solid rgba(200,146,59,0.08)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 200 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                backgroundColor: "#C8923B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Crown size={28} color="#14110F" strokeWidth={1.75} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#F6F1E7",
                  }}
                >
                  Combo VIP
                </h3>
                <span
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#14110F",
                    backgroundColor: "#C8923B",
                    borderRadius: 100,
                    padding: "3px 10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Phổ biến nhất
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 14,
                  color: "#8A8178",
                  lineHeight: 1.6,
                }}
              >
                Cắt tóc + Cạo râu + Gội dưỡng + Massage đầu. Trải nghiệm hoàn chỉnh từ A đến Z.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 12,
                  color: "#8A8178",
                  marginBottom: 4,
                }}
              >
                150 phút · Tiết kiệm 30%
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#C8923B",
                  lineHeight: 1,
                }}
              >
                450.000₫
              </div>
            </div>
            <button
              onClick={() => handleSelectService("combo-vip")}
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
                transition: "all 200ms",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#A9722A";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#C8923B";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Đặt ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
