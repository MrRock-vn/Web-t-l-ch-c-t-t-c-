import { Star, CheckCircle2, MapPin } from "lucide-react";
import { useApp } from "../context/AppContext";

function StarRating({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          fill={i <= Math.round(value) ? "#C8923B" : "none"}
          color={i <= Math.round(value) ? "#C8923B" : "#8A8178"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function Barbers() {
  const { barbers, setSelectedSalonIdForBooking, setPreselectedBarberId } = useApp();

  const handleSelectBarber = (salonId: number, barberId: string) => {
    setSelectedSalonIdForBooking(salonId);
    setPreselectedBarberId(barberId);
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="barbers" style={{ backgroundColor: "#1F1A17", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 52,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
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
                Barber nổi bật
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(26px, 3.5vw, 42px)",
                fontWeight: 700,
                color: "#F6F1E7",
                lineHeight: 1.2,
              }}
            >
              Thợ <span style={{ color: "#C8923B", fontStyle: "italic" }}>lành nghề</span>
            </h2>
          </div>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 15,
              color: "#8A8178",
              maxWidth: 340,
              lineHeight: 1.65,
            }}
          >
            Những barber được đánh giá cao nhất trên nền tảng Barber Spa, đến từ 120+ salon đối tác.
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {barbers.slice(0, 4).map((b) => (
            <div
              key={b.id}
              onClick={() => handleSelectBarber(b.salonId, b.id)}
              style={{
                backgroundColor: "#14110F",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(200,146,59,0.1)",
                transition: "all 250ms ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(200,146,59,0.45)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)";
                const img = el.querySelector("img") as HTMLImageElement;
                if (img) img.style.transform = "scale(1.04)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(200,146,59,0.1)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
                const img = el.querySelector("img") as HTMLImageElement;
                if (img) img.style.transform = "scale(1)";
              }}
            >
              <div
                style={{
                  height: 256,
                  overflow: "hidden",
                  backgroundColor: "#1F1A17",
                  position: "relative",
                }}
              >
                <img
                  src={b.photo}
                  alt={`Barber ${b.name}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    transition: "transform 400ms ease",
                    filter: "brightness(0.88)",
                  }}
                />
                {b.verified && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "rgba(20,17,15,0.88)",
                      border: "1px solid rgba(200,146,59,0.35)",
                      borderRadius: 100,
                      padding: "4px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <CheckCircle2 size={12} color="#C8923B" />
                    <span
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#C8923B",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Đã xác minh
                    </span>
                  </div>
                )}
              </div>

              <div style={{ padding: "20px 20px 22px" }}>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#F6F1E7",
                    marginBottom: 3,
                  }}
                >
                  {b.name}
                </h3>
                <p
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 12,
                    color: "#8A8178",
                    marginBottom: 4,
                  }}
                >
                  {b.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                  <MapPin size={11} color="#C8923B" />
                  <span
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      color: "#8A8178",
                    }}
                  >
                    {b.salon}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                  <StarRating value={b.rating} />
                  <span
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#F6F1E7",
                    }}
                  >
                    {b.rating}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      color: "#8A8178",
                    }}
                  >
                    ({b.reviews})
                  </span>
                </div>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {b.specialties.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#C8923B",
                        backgroundColor: "rgba(200,146,59,0.1)",
                        border: "1px solid rgba(200,146,59,0.18)",
                        borderRadius: 100,
                        padding: "3px 9px",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
