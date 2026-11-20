import { useState } from "react";
import { Search, MapPin, ChevronRight, TrendingUp } from "lucide-react";
import { useApp } from "../context/AppContext";

const CHIPS = ["Cắt tóc", "Gội đầu", "Massage đầu", "Cạo râu", "Nhuộm tóc", "Combo VIP"];

const STATS = [
  { value: "120+", label: "Salon đối tác" },
  { value: "48.000+", label: "Lượt đặt lịch" },
  { value: "4.9★", label: "Đánh giá trung bình" },
];

const DISTRICTS = ["Tất cả khu vực", "Hoàn Kiếm", "Đống Đa", "Cầu Giấy", "Hai Bà Trưng", "Tây Hồ", "Ba Đình"];

export function Hero() {
  const {
    setSearchKeyword,
    setSelectedDistrictFilter,
    setSelectedServiceFilter,
  } = useApp();

  const [activeChip, setActiveChip] = useState("Cắt tóc");
  const [searchVal, setSearchVal] = useState("");
  const [district, setDistrict] = useState("Tất cả khu vực");

  const handleSearch = () => {
    setSearchKeyword(searchVal);
    setSelectedDistrictFilter(district === "Tất cả khu vực" ? "Tất cả" : district);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    setSelectedServiceFilter(chip);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#14110F",
      }}
    >
      {/* Background photo */}
      <img
        src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&h=900&fit=crop&auto=format"
        alt="Không gian barber shop sang trọng"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: 0.22,
        }}
        loading="eager"
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(140deg, rgba(20,17,15,0.92) 0%, rgba(20,17,15,0.55) 55%, rgba(20,17,15,0.88) 100%)",
        }}
      />
      {/* Brass accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "38%",
          width: 4,
          height: 200,
          backgroundColor: "#C8923B",
          borderRadius: "0 4px 4px 0",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "128px 24px 88px",
          width: "100%",
        }}
      >
        {/* Platform badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(200,146,59,0.12)",
            border: "1px solid rgba(200,146,59,0.35)",
            borderRadius: 100,
            padding: "6px 14px",
            marginBottom: 28,
          }}
        >
          <TrendingUp size={13} color="#C8923B" />
          <span
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#C8923B",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Nền tảng đặt lịch Barber Spa #1 Việt Nam
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(36px, 5.5vw, 62px)",
            fontWeight: 700,
            color: "#F6F1E7",
            lineHeight: 1.1,
            maxWidth: 700,
            marginBottom: 20,
          }}
        >
          Gọn gàng.{" "}
          <span style={{ color: "#C8923B", fontStyle: "italic" }}>Đặt lịch</span> trong 30 giây.
        </h1>

        <p
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 17,
            color: "#EDE8DE",
            lineHeight: 1.7,
            maxWidth: 500,
            marginBottom: 40,
            opacity: 0.88,
          }}
        >
          Tìm và đặt lịch tại 120+ salon uy tín trên toàn Hà Nội — không gọi điện, không chờ hàng.
        </p>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 10, maxWidth: 660, marginBottom: 18, flexWrap: "wrap" }}>
          <div
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: "rgba(246,241,231,0.07)",
              border: "1px solid rgba(200,146,59,0.28)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 16px",
              backdropFilter: "blur(8px)",
            }}
          >
            <Search size={17} color="#C8923B" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tên salon, dịch vụ, khu vực..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "#F6F1E7",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 15,
                padding: "15px 0",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(246,241,231,0.07)",
              border: "1px solid rgba(200,146,59,0.28)",
              borderRadius: 12,
              padding: "0 14px",
              backdropFilter: "blur(8px)",
              minWidth: 140,
            }}
          >
            <MapPin size={15} color="#C8923B" />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#EDE8DE",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
                padding: "15px 0",
              }}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d} style={{ backgroundColor: "#1F1A17", color: "#F6F1E7" }}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            style={{
              backgroundColor: "#C8923B",
              color: "#14110F",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 12,
              padding: "15px 28px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 200ms",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#A9722A";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#C8923B";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Tìm salon <ChevronRight size={15} />
          </button>
        </div>

        {/* Service chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 64 }}>
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.02em",
                border: `1.5px solid ${activeChip === chip ? "#C8923B" : "rgba(246,241,231,0.2)"}`,
                borderRadius: 100,
                padding: "7px 16px",
                cursor: "pointer",
                backgroundColor: activeChip === chip ? "#C8923B" : "rgba(246,241,231,0.05)",
                color: activeChip === chip ? "#14110F" : "#EDE8DE",
                transition: "all 200ms",
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 48,
            flexWrap: "wrap",
            paddingTop: 32,
            borderTop: "1px solid rgba(200,146,59,0.18)",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#C8923B",
                  lineHeight: 1.1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 13,
                  color: "#8A8178",
                  marginTop: 5,
                  letterSpacing: "0.02em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
