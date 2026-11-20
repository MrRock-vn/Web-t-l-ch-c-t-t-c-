import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, Flag, MessageSquarePlus } from "lucide-react";
import { useApp } from "../context/AppContext";

function StarRating({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= value ? "#C8923B" : "none"}
          color={i <= value ? "#C8923B" : "rgba(246,241,231,0.2)"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function Reviews() {
  const { reviews, reportReview, setMyBookingsOpen } = useApp();
  const visiblePool = reviews.filter((r) => !r.hidden);

  const [page, setPage] = useState(0);
  const [reportedToast, setReportedToast] = useState<string | null>(null);

  const CARDS_PER_PAGE = 3;
  const total_pages = Math.max(1, Math.ceil(visiblePool.length / CARDS_PER_PAGE));

  const prev = () => setPage((p) => (p - 1 + total_pages) % total_pages);
  const next = () => setPage((p) => (p + 1) % total_pages);

  const start = page * CARDS_PER_PAGE;
  const visible =
    visiblePool.length > 0
      ? [
          visiblePool[start % visiblePool.length],
          visiblePool[(start + 1) % visiblePool.length],
          visiblePool[(start + 2) % visiblePool.length],
        ]
      : [];

  return (
    <section
      id="reviews"
      style={{ backgroundColor: "#14110F", padding: "96px 24px", overflow: "hidden" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 52,
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
                Đánh giá
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
              Khách hàng{" "}
              <span style={{ color: "#C8923B", fontStyle: "italic" }}>nói gì</span>
            </h2>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setMyBookingsOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(200,146,59,0.14)",
                border: "1.5px solid rgba(200,146,59,0.4)",
                borderRadius: 100,
                padding: "10px 18px",
                color: "#C8923B",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <MessageSquarePlus size={15} /> Viết đánh giá
            </button>
            {[prev, next].map((fn, i) => (
              <button
                key={i}
                onClick={fn}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(200,146,59,0.3)",
                  backgroundColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#C8923B",
                  transition: "all 200ms",
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
                {i === 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            ))}
          </div>
        </div>

        {reportedToast && (
          <div
            style={{
              backgroundColor: "rgba(200,146,59,0.15)",
              border: "1px solid rgba(200,146,59,0.4)",
              color: "#F6F1E7",
              padding: "10px 16px",
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
            }}
          >
            {reportedToast}
          </div>
        )}

        {/* Cards — responsive 3 cols */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {visible.map((r, i) => (
            <div
              key={`${r.id}-${page}-${i}`}
              style={{
                backgroundColor: "#1F1A17",
                borderRadius: 16,
                padding: "28px 24px 24px",
                border: "1px solid rgba(200,146,59,0.12)",
                display: "flex",
                flexDirection: "column",
                transition: "all 250ms ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(200,146,59,0.35)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(200,146,59,0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ position: "absolute", top: 18, right: 18, opacity: 0.1 }}>
                <Quote size={32} color="#C8923B" />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <StarRating value={r.rating} />
                <span
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 12,
                    color: "#8A8178",
                  }}
                >
                  {r.date}
                </span>
              </div>

              <p
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 14,
                  color: "#EDE8DE",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  flex: 1,
                  marginBottom: 14,
                }}
              >
                "{r.text}"
              </p>

              {/* Phản hồi công khai của Chủ Salon (Mục 2.6.1 Báo cáo) */}
              {r.ownerReply && (
                <div
                  style={{
                    backgroundColor: "rgba(200,146,59,0.08)",
                    borderLeft: "3px solid #C8923B",
                    borderRadius: "0 8px 8px 0",
                    padding: "10px 12px",
                    marginBottom: 16,
                    fontSize: 12,
                    color: "#EDE8DE",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#C8923B", marginBottom: 2 }}>
                    Phản hồi từ Chủ Salon:
                  </div>
                  {r.ownerReply}
                </div>
              )}

              <div style={{ marginBottom: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#C8923B",
                    backgroundColor: "rgba(200,146,59,0.1)",
                    border: "1px solid rgba(200,146,59,0.2)",
                    borderRadius: 100,
                    padding: "3px 10px",
                  }}
                >
                  {r.service}
                </span>
                <span
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 11,
                    color: "#8A8178",
                    backgroundColor: "rgba(246,241,231,0.05)",
                    border: "1px solid rgba(246,241,231,0.08)",
                    borderRadius: 100,
                    padding: "3px 10px",
                  }}
                >
                  {r.salon}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 16,
                  borderTop: "1px solid rgba(200,146,59,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      backgroundColor: "#C8923B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#14110F",
                      flexShrink: 0,
                    }}
                  >
                    {r.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#F6F1E7",
                      }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 12,
                        color: "#8A8178",
                      }}
                    >
                      Thợ: {r.barber}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    reportReview(r.id, "Nội dung đánh giá cần kiểm duyệt");
                    setReportedToast(
                      `Đã gửi báo cáo đánh giá của "${r.name}" tới Quản trị viên (Admin).`
                    );
                    setTimeout(() => setReportedToast(null), 3500);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: r.reported ? "#B5483A" : "#8A8178",
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                  }}
                  title="Báo cáo đánh giá không phù hợp"
                >
                  <Flag size={12} /> {r.reported ? "Đã báo cáo" : "Báo cáo"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {Array.from({ length: total_pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 24 : 8,
                height: 8,
                borderRadius: 100,
                backgroundColor: i === page ? "#C8923B" : "rgba(200,146,59,0.22)",
                border: "none",
                cursor: "pointer",
                transition: "all 300ms",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
