import { useState, useEffect } from "react";
import { Menu, X, Scissors, Calendar, User, Store, Shield, Bell, CheckCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

export function Navigation() {
  const {
    currentUser,
    bookings,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
    openAuthModal,
    setMyBookingsOpen,
    activeView,
    setActiveView,
  } = useApp();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    if (activeView !== "landing") {
      setActiveView("landing");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const links = [
    { label: "Khám phá", id: "explore" },
    { label: "Dịch vụ", id: "services" },
    { label: "Barber nổi bật", id: "barbers" },
    { label: "Đánh giá", id: "reviews" },
  ];

  const solidNav = scrolled || activeView !== "landing";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 300ms ease",
        backgroundColor: solidNav ? "rgba(20,17,15,0.96)" : "transparent",
        backdropFilter: solidNav ? "blur(14px)" : "none",
        borderBottom: solidNav ? "1px solid rgba(200,146,59,0.15)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
          gap: 18,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => {
            setActiveView("landing");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: "#C8923B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scissors size={16} color="#14110F" strokeWidth={2.2} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, textAlign: "left" }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 17,
                fontWeight: 700,
                color: "#F6F1E7",
                letterSpacing: "0.06em",
              }}
            >
              Barber Spa
            </span>
            <span
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                color: "#C8923B",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Nền tảng đặt lịch
            </span>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: 22, flex: 1 }}>
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#EDE8DE",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "0.02em",
                transition: "color 200ms",
                padding: "4px 0",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C8923B")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#EDE8DE")}
            >
              {l.label}
            </button>
          ))}

          {/* Lịch hẹn của tôi (Use Case 2.4) */}
          <button
            onClick={() => setMyBookingsOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(200,146,59,0.12)",
              border: "1px solid rgba(200,146,59,0.3)",
              borderRadius: 100,
              padding: "5px 12px",
              cursor: "pointer",
              color: "#C8923B",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <Calendar size={13} />
            Lịch hẹn ({bookings.length})
          </button>

          {/* Chỉ hiển thị nút Dashboard khi tài khoản có đúng vai trò */}
          {(currentUser?.role === "owner" || currentUser?.role === "admin") && (
            <button
              onClick={() => setActiveView(activeView === "owner" ? "landing" : "owner")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: activeView === "owner" ? "#C8923B" : "transparent",
                border: "1px solid rgba(200,146,59,0.3)",
                borderRadius: 100,
                padding: "5px 12px",
                cursor: "pointer",
                color: activeView === "owner" ? "#14110F" : "#EDE8DE",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              <Store size={12} /> Chủ Salon
            </button>
          )}

          {currentUser?.role === "admin" && (
            <button
              onClick={() => setActiveView(activeView === "admin" ? "landing" : "admin")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: activeView === "admin" ? "#C8923B" : "transparent",
                border: "1px solid rgba(200,146,59,0.3)",
                borderRadius: 100,
                padding: "5px 12px",
                cursor: "pointer",
                color: activeView === "admin" ? "#14110F" : "#EDE8DE",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              <Shield size={12} /> Admin
            </button>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, position: "relative" }}>
          {currentUser && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotiOpen((v) => !v)}
                aria-label="Thông báo"
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: notiOpen ? "rgba(200,146,59,0.2)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(200,146,59,0.35)",
                  color: "#EDE8DE",
                  cursor: "pointer",
                }}
              >
                <Bell size={16} color="#C8923B" />
                {unreadNotificationCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      backgroundColor: "#D9534F",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notiOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 46,
                    right: 0,
                    width: 340,
                    maxHeight: 400,
                    overflowY: "auto",
                    backgroundColor: "#FDFAF4",
                    color: "#14110F",
                    borderRadius: 14,
                    border: "1px solid rgba(31,26,23,0.14)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                    zIndex: 120,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(31,26,23,0.08)",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      Thông báo ({unreadNotificationCount} mới)
                    </span>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "none",
                          border: "none",
                          color: "#C8923B",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <CheckCheck size={13} /> Đọc hết
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#8A8178", fontSize: 13 }}>
                      Chưa có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && markNotificationRead(n.id)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid rgba(31,26,23,0.06)",
                          backgroundColor: n.read ? "transparent" : "rgba(200,146,59,0.1)",
                          cursor: n.read ? "default" : "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#14110F" }}>{n.title}</div>
                        <div style={{ fontSize: 12.5, color: "#57504A", marginTop: 3, lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => openAuthModal(currentUser ? "profile" : "login")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1px solid rgba(200,146,59,0.4)",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              color: "#EDE8DE",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              transition: "all 200ms",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C8923B";
              e.currentTarget.style.color = "#C8923B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(200,146,59,0.4)";
              e.currentTarget.style.color = "#EDE8DE";
            }}
          >
            <User size={14} />
            {currentUser ? currentUser.name.split(" ").slice(-2).join(" ") : "Đăng nhập"}
          </button>
          <button
            onClick={() => scrollTo("booking")}
            style={{
              backgroundColor: "#C8923B",
              color: "#14110F",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.04em",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
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
            Đặt lịch
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#F6F1E7",
            padding: 8,
            flexShrink: 0,
          }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="flex md:hidden flex-col"
          style={{
            backgroundColor: "#14110F",
            borderTop: "1px solid rgba(200,146,59,0.15)",
            padding: "16px 24px 28px",
          }}
        >
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#EDE8DE",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 16,
                fontWeight: 500,
                textAlign: "left",
                padding: "12px 0",
                borderBottom: "1px solid rgba(200,146,59,0.08)",
              }}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              setMyBookingsOpen(true);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#C8923B",
              fontSize: 15,
              fontWeight: 600,
              textAlign: "left",
              padding: "12px 0",
            }}
          >
            Lịch hẹn của tôi ({bookings.length})
          </button>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={() => {
                setMenuOpen(false);
                openAuthModal(currentUser ? "profile" : "login");
              }}
              style={{
                flex: 1,
                border: "1px solid rgba(200,146,59,0.4)",
                backgroundColor: "transparent",
                borderRadius: 10,
                padding: "12px",
                cursor: "pointer",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: "#EDE8DE",
              }}
            >
              {currentUser ? currentUser.name : "Đăng nhập"}
            </button>
            <button
              onClick={() => scrollTo("booking")}
              style={{
                flex: 1,
                backgroundColor: "#C8923B",
                color: "#14110F",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                borderRadius: 10,
                padding: "12px",
                cursor: "pointer",
              }}
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
