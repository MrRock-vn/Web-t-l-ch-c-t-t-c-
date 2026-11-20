import { useState } from "react";
import { Star, MapPin, CheckCircle2, SlidersHorizontal, ChevronRight, Eye } from "lucide-react";
import { useApp } from "../context/AppContext";

const DISTRICTS = ["Tất cả", "Hoàn Kiếm", "Đống Đa", "Cầu Giấy", "Hai Bà Trưng", "Tây Hồ", "Ba Đình"];
const SERVICES_FILTER = ["Tất cả dịch vụ", "Cắt tóc", "Cạo râu", "Nhuộm tóc", "Uốn tóc", "Combo VIP"];

export function Explore() {
  const {
    salons,
    searchKeyword,
    setSearchKeyword,
    selectedDistrictFilter,
    setSelectedDistrictFilter,
    selectedServiceFilter,
    setSelectedServiceFilter,
    setSelectedSalonIdForBooking,
    setDetailSalon,
  } = useApp();

  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "booked">("rating");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const filtered = salons
    .filter((s) => {
      if (s.status === "hidden") return false;
      if (onlyOpen && !s.open) return false;
      if (onlyVerified && !s.verified) return false;
      const districtMatch =
        selectedDistrictFilter === "Tất cả" || s.district === selectedDistrictFilter;
      const serviceMatch =
        selectedServiceFilter === "Tất cả dịch vụ" || s.tags.includes(selectedServiceFilter);
      const kw = searchKeyword.trim().toLowerCase();
      const keywordMatch =
        !kw ||
        s.name.toLowerCase().includes(kw) ||
        s.address.toLowerCase().includes(kw) ||
        s.district.toLowerCase().includes(kw) ||
        s.tags.some((t) => t.toLowerCase().includes(kw));
      return districtMatch && serviceMatch && keywordMatch;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.priceFrom - b.priceFrom;
      if (sortBy === "booked") return b.booked - a.booked;
      return b.rating - a.rating || b.reviews - a.reviews;
    });

  return (
    <section id="explore" style={{ backgroundColor: "#F6F1E7", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 40,
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
                Salon đối tác
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
              Khám phá{" "}
              <span style={{ color: "#C8923B", fontStyle: "italic" }}>salon gần bạn</span>
            </h2>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: showFilters ? "#C8923B" : "transparent",
              border: `1.5px solid ${showFilters ? "#C8923B" : "rgba(31,26,23,0.15)"}`,
              borderRadius: 10,
              padding: "10px 18px",
              cursor: "pointer",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: showFilters ? "#14110F" : "#1F1A17",
              transition: "all 200ms",
            }}
          >
            <SlidersHorizontal size={15} />
            Bộ lọc
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 32 }}>
          {/* District chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {DISTRICTS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrictFilter(d)}
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1.5px solid ${
                    selectedDistrictFilter === d ? "#C8923B" : "rgba(31,26,23,0.12)"
                  }`,
                  borderRadius: 100,
                  padding: "7px 16px",
                  cursor: "pointer",
                  backgroundColor: selectedDistrictFilter === d ? "#C8923B" : "transparent",
                  color: selectedDistrictFilter === d ? "#14110F" : "#1F1A17",
                  transition: "all 200ms",
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Service filter */}
          {showFilters && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                paddingTop: 12,
                borderTop: "1px solid rgba(31,26,23,0.08)",
              }}
            >
              {SERVICES_FILTER.map((sv) => (
                <button
                  key={sv}
                  onClick={() => setSelectedServiceFilter(sv)}
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1.5px solid ${
                      selectedServiceFilter === sv ? "#C8923B" : "rgba(31,26,23,0.12)"
                    }`,
                    borderRadius: 100,
                    padding: "6px 14px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedServiceFilter === sv ? "rgba(200,146,59,0.1)" : "transparent",
                    color: selectedServiceFilter === sv ? "#C8923B" : "#8A8178",
                    transition: "all 200ms",
                  }}
                >
                  {sv}
                </button>
              ))}

              {/* Bộ lọc nhanh trạng thái + sắp xếp */}
              <button
                onClick={() => setOnlyOpen(!onlyOpen)}
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1.5px solid ${onlyOpen ? "#2F5B37" : "rgba(31,26,23,0.12)"}`,
                  borderRadius: 100,
                  padding: "6px 14px",
                  cursor: "pointer",
                  backgroundColor: onlyOpen ? "rgba(110,139,116,0.16)" : "transparent",
                  color: onlyOpen ? "#2F5B37" : "#8A8178",
                }}
              >
                ● Đang mở cửa
              </button>
              <button
                onClick={() => setOnlyVerified(!onlyVerified)}
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1.5px solid ${onlyVerified ? "#C8923B" : "rgba(31,26,23,0.12)"}`,
                  borderRadius: 100,
                  padding: "6px 14px",
                  cursor: "pointer",
                  backgroundColor: onlyVerified ? "rgba(200,146,59,0.14)" : "transparent",
                  color: onlyVerified ? "#A9722A" : "#8A8178",
                }}
              >
                ✓ Đã xác minh
              </button>

              <select
                aria-label="Sắp xếp salon"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "rating" | "price_asc" | "booked")}
                style={{
                  marginLeft: "auto",
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 100,
                  border: "1.5px solid rgba(31,26,23,0.15)",
                  backgroundColor: "#FDFAF4",
                  color: "#14110F",
                  cursor: "pointer",
                }}
              >
                <option value="rating">Sắp xếp: Đánh giá cao nhất</option>
                <option value="price_asc">Sắp xếp: Giá thấp → cao</option>
                <option value="booked">Sắp xếp: Đặt nhiều nhất</option>
              </select>
            </div>
          )}
        </div>

        {/* Results count */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 14, color: "#8A8178", margin: 0 }}>
            Tìm thấy <strong style={{ color: "#14110F" }}>{filtered.length}</strong> salon
            {selectedDistrictFilter !== "Tất cả" ? ` tại ${selectedDistrictFilter}` : ""}
            {searchKeyword ? ` với từ khóa "${searchKeyword}"` : ""}
          </p>
          {(searchKeyword ||
            selectedDistrictFilter !== "Tất cả" ||
            selectedServiceFilter !== "Tất cả dịch vụ" ||
            onlyOpen ||
            onlyVerified ||
            sortBy !== "rating") && (
            <button
              onClick={() => {
                setSearchKeyword("");
                setSelectedDistrictFilter("Tất cả");
                setSelectedServiceFilter("Tất cả dịch vụ");
                setOnlyOpen(false);
                setOnlyVerified(false);
                setSortBy("rating");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#C8923B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Salon grid */}
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              color: "#8A8178",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 15,
            }}
          >
            Không tìm thấy salon phù hợp. Thử thay đổi bộ lọc.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {filtered.map((salon) => (
              <div
                key={salon.id}
                onClick={() => setDetailSalon(salon)}
                style={{
                  backgroundColor: "#FDFAF4",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(31,26,23,0.08)",
                  transition: "all 250ms ease",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(200,146,59,0.1)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(200,146,59,0.2)";
                  const img = e.currentTarget.querySelector("img") as HTMLImageElement;
                  if (img) img.style.transform = "scale(1.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(31,26,23,0.08)";
                  const img = e.currentTarget.querySelector("img") as HTMLImageElement;
                  if (img) img.style.transform = "scale(1)";
                }}
              >
                {/* Photo */}
                <div
                  style={{
                    height: 200,
                    overflow: "hidden",
                    backgroundColor: "#EDE8DE",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={salon.photo}
                    alt={salon.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 400ms ease",
                    }}
                  />
                  {/* Status badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      backgroundColor: salon.open
                        ? "rgba(110,139,116,0.92)"
                        : "rgba(138,129,120,0.92)",
                      borderRadius: 100,
                      padding: "4px 12px",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {salon.open ? "Đang mở cửa" : "Đã đóng cửa"}
                  </div>
                  {salon.verified && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        backgroundColor: "rgba(20,17,15,0.82)",
                        border: "1px solid rgba(200,146,59,0.4)",
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
                        }}
                      >
                        Đã xác minh
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#14110F",
                      }}
                    >
                      {salon.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      <Star size={13} fill="#C8923B" color="#C8923B" />
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#14110F",
                        }}
                      >
                        {salon.rating}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 12,
                          color: "#8A8178",
                        }}
                      >
                        ({salon.reviews})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                    <MapPin size={12} color="#C8923B" />
                    <span
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 13,
                        color: "#8A8178",
                      }}
                    >
                      {salon.address}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, flex: 1 }}>
                    {salon.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#C8923B",
                          backgroundColor: "rgba(200,146,59,0.08)",
                          border: "1px solid rgba(200,146,59,0.15)",
                          borderRadius: 100,
                          padding: "3px 10px",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 14,
                      borderTop: "1px solid rgba(31,26,23,0.07)",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 12, color: "#8A8178" }}>
                        Từ{" "}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 17,
                          fontWeight: 700,
                          color: "#C8923B",
                        }}
                      >
                        {salon.priceFrom.toLocaleString("vi-VN")}₫
                      </span>
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: 11,
                          color: "#8A8178",
                          marginLeft: 6,
                        }}
                      >
                        · {salon.booked} lượt/tháng
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailSalon(salon);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "transparent",
                          color: "#1F1A17",
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontWeight: 600,
                          fontSize: 12,
                          border: "1px solid rgba(31,26,23,0.15)",
                          borderRadius: 8,
                          padding: "9px 11px",
                          cursor: "pointer",
                        }}
                        title="Xem chi tiết Salon"
                      >
                        <Eye size={13} /> Chi tiết
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSalonIdForBooking(salon.id);
                          document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#C8923B",
                          color: "#14110F",
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                          border: "none",
                          borderRadius: 8,
                          padding: "9px 14px",
                          cursor: "pointer",
                          transition: "all 200ms",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A9722A")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C8923B")}
                      >
                        Đặt lịch <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
