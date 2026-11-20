import { Scissors, Phone, Mail, Instagram, Facebook, Youtube, Globe } from "lucide-react";
import { useApp } from "../context/AppContext";

const LINKS = {
  "Dịch vụ": ["Cắt tóc", "Uốn tóc", "Nhuộm tóc", "Cạo râu", "Combo VIP"],
  "Nền tảng": ["Về Barber Spa", "Blog phong cách", "Tuyển dụng", "Báo chí"],
  "Hỗ trợ": ["Hướng dẫn đặt lịch", "Chính sách hủy lịch", "Điều khoản", "Bảo mật"],
};

export function Footer() {
  const { openAuthModal } = useApp();

  return (
    <footer style={{ backgroundColor: "#14110F", borderTop: "1px solid rgba(200,146,59,0.12)" }}>
      {/* Salon owner CTA */}
      <div
        style={{
          backgroundColor: "#1F1A17",
          borderBottom: "1px solid rgba(200,146,59,0.1)",
          padding: "52px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 28,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(200,146,59,0.1)",
                border: "1px solid rgba(200,146,59,0.2)",
                borderRadius: 100,
                padding: "5px 14px",
                marginBottom: 16,
              }}
            >
              <Globe size={12} color="#C8923B" />
              <span
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#C8923B",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Dành cho chủ salon
              </span>
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(20px, 2.5vw, 30px)",
                fontWeight: 700,
                color: "#F6F1E7",
                marginBottom: 10,
                lineHeight: 1.25,
              }}
            >
              Bạn có salon?{" "}
              <span style={{ color: "#C8923B", fontStyle: "italic" }}>
                Đăng ký quản lý miễn phí.
              </span>
            </h3>
            <p
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 15,
                color: "#8A8178",
                maxWidth: 440,
                lineHeight: 1.65,
              }}
            >
              Tiếp cận hàng nghìn khách hàng, quản lý lịch hẹn và đội ngũ trong một nền tảng. Không phí cài đặt, không ràng buộc hợp đồng.
            </p>
          </div>
          <button
            onClick={() => openAuthModal("register")}
            style={{
              backgroundColor: "transparent",
              border: "2px solid #C8923B",
              borderRadius: 10,
              padding: "14px 32px",
              cursor: "pointer",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "#C8923B",
              letterSpacing: "0.03em",
              transition: "all 200ms",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#C8923B";
              e.currentTarget.style.color = "#14110F";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#C8923B";
            }}
          >
            Đăng ký ngay →
          </button>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr repeat(3, 1fr)",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#C8923B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Scissors size={18} color="#14110F" strokeWidth={2} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#F6F1E7",
                    letterSpacing: "0.05em",
                  }}
                >
                  Barber Spa
                </div>
                <div
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 10,
                    color: "#C8923B",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    marginTop: 1,
                  }}
                >
                  Nền tảng đặt lịch
                </div>
              </div>
            </div>
            <p
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 14,
                color: "#8A8178",
                lineHeight: 1.7,
                maxWidth: 260,
                marginBottom: 24,
              }}
            >
              Website Đặt Lịch Salon / Barber Trực Tuyến – Barber Spa. Kết nối 48.000+ khách hàng với 120+ salon uy tín trên toàn quốc.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: Phone, text: "1800 6789 (Miễn phí)" },
                { icon: Mail, text: "hello@barberspa.vn" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={14} color="#C8923B" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 13,
                      color: "#8A8178",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h4
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#C8923B",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 18,
                }}
              >
                {heading}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 14,
                        color: "#8A8178",
                        textDecoration: "none",
                        transition: "color 200ms",
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F6F1E7")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#8A8178")}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: 24,
            borderTop: "1px solid rgba(200,146,59,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, color: "#8A8178" }}>
            © 2026 Barber Spa (Học phần Ngôn ngữ kịch bản - ĐH Điện Lực). Bảo lưu mọi quyền.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { icon: Facebook, label: "Facebook" },
              { icon: Instagram, label: "Instagram" },
              { icon: Youtube, label: "Youtube" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-label={label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(200,146,59,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8A8178",
                  textDecoration: "none",
                  transition: "all 200ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C8923B";
                  e.currentTarget.style.color = "#C8923B";
                  e.currentTarget.style.backgroundColor = "rgba(200,146,59,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,146,59,0.18)";
                  e.currentTarget.style.color = "#8A8178";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
