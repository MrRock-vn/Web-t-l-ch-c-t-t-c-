import { useState, useEffect } from "react";
import { X, User, Shield, Store, CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

export function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalInitialTab,
    currentUser,
    bookings,
    login,
    quickLoginRole,
    register,
    updateProfile,
    changePassword,
    logout,
  } = useApp();

  const [tab, setTab] = useState<"login" | "register" | "profile">("login");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("khachhang@barberspa.vn");
  const [loginPassword, setLoginPassword] = useState("123456");

  // Register state
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer" as "customer" | "owner",
    address: "",
    birthDate: "",
    salonName: "",
    district: "Hoàn Kiếm",
  });

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    birthDate: "",
  });

  // Change password state
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setTab(currentUser && authModalInitialTab === "profile" ? "profile" : authModalInitialTab);
    setError("");
    setSuccessMsg("");
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        phone: currentUser.phone,
        address: currentUser.address || "",
        birthDate: currentUser.birthDate || "",
      });
    }
  }, [authModalOpen, authModalInitialTab, currentUser]);

  if (!authModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await login(loginEmail, loginPassword);
    if (!res.ok) {
      setError(res.error || "Đăng nhập thất bại");
      setLoginPassword(""); // Theo đặc tả 2.2.1: Mật khẩu sai -> không lưu mật khẩu trên form
      return;
    }
    setAuthModalOpen(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await register(regForm);
    if (!res.ok) {
      setError(res.error || "Đăng ký thất bại");
      return;
    }
    setSuccessMsg("Tài khoản mới được tạo thành công!");
    setTimeout(() => {
      setAuthModalOpen(false);
    }, 900);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileForm);
    setSuccessMsg("Đã cập nhật thông tin cá nhân thành công!");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (pwForm.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }
    const res = await changePassword(pwForm.currentPassword, pwForm.newPassword);
    if (!res.ok) {
      setError(res.error || "Đổi mật khẩu thất bại.");
      return;
    }
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setSuccessMsg("Đổi mật khẩu thành công!");
  };

  const completedCount = currentUser
    ? bookings.filter((b) => b.customerId === currentUser.id && b.status === "completed").length
    : 0;
  const loyaltyPoints = completedCount * 100;
  const memberTier =
    completedCount >= 10 ? "VIP Kim Cương" : completedCount >= 3 ? "Thành viên Vàng" : "Thành viên Bạc";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(20,17,15,0.82)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          backgroundColor: "#FDFAF4",
          borderRadius: 20,
          border: "1px solid rgba(200,146,59,0.28)",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Top dark banner */}
        <div
          style={{
            backgroundColor: "#14110F",
            padding: "22px 26px",
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
              Barber Spa · Phân quyền 3 Vai trò
            </span>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#F6F1E7",
                marginTop: 4,
              }}
            >
              {tab === "login"
                ? "Đăng nhập hệ thống"
                : tab === "register"
                ? "Đăng ký tài khoản"
                : "Hồ sơ cá nhân"}
            </h3>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            style={{
              background: "rgba(246,241,231,0.08)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#EDE8DE",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(31,26,23,0.1)",
            backgroundColor: "#F6F1E7",
          }}
        >
          {[
            { id: "login", label: "Đăng nhập" },
            { id: "register", label: "Đăng ký mới" },
            ...(currentUser ? [{ id: "profile", label: "Thông tin cá nhân" }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as "login" | "register" | "profile");
                setError("");
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "13px 12px",
                background: "none",
                border: "none",
                borderBottom: `2.5px solid ${tab === t.id ? "#C8923B" : "transparent"}`,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "#14110F" : "#8A8178",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px 26px 28px" }}>
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(181,72,58,0.1)",
                border: "1px solid rgba(181,72,58,0.3)",
                color: "#B5483A",
                padding: "12px 14px",
                borderRadius: 10,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(110,139,116,0.14)",
                border: "1px solid rgba(110,139,116,0.4)",
                color: "#3F5E46",
                padding: "12px 14px",
                borderRadius: 10,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === "login" && (
            <>
              {/* Quick Demo Role Switcher for Grading */}
              <div
                style={{
                  backgroundColor: "rgba(200,146,59,0.08)",
                  border: "1px solid rgba(200,146,59,0.25)",
                  borderRadius: 12,
                  padding: "14px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#C8923B",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Đăng nhập nhanh 3 Actor (Theo Bảng 2.1 Báo cáo)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => quickLoginRole("customer")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      padding: "10px 8px",
                      borderRadius: 10,
                      border: "1px solid rgba(31,26,23,0.12)",
                      backgroundColor: "#FDFAF4",
                      cursor: "pointer",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#14110F",
                    }}
                  >
                    <User size={16} color="#C8923B" />
                    Khách hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLoginRole("owner")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      padding: "10px 8px",
                      borderRadius: 10,
                      border: "1px solid rgba(31,26,23,0.12)",
                      backgroundColor: "#FDFAF4",
                      cursor: "pointer",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#14110F",
                    }}
                  >
                    <Store size={16} color="#C8923B" />
                    Chủ Salon
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLoginRole("admin")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      padding: "10px 8px",
                      borderRadius: 10,
                      border: "1px solid rgba(31,26,23,0.12)",
                      backgroundColor: "#FDFAF4",
                      cursor: "pointer",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#14110F",
                    }}
                  >
                    <Shield size={16} color="#C8923B" />
                    Admin
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1F1A17",
                      marginBottom: 6,
                    }}
                  >
                    Email / Tên đăng nhập *
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="khachhang@barberspa.vn | owner@barberspa.vn | admin@barberspa.vn"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid rgba(31,26,23,0.15)",
                      backgroundColor: "#fff",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1F1A17",
                      marginBottom: 6,
                    }}
                  >
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid rgba(31,26,23,0.15)",
                      backgroundColor: "#fff",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: 6,
                    backgroundColor: "#C8923B",
                    color: "#14110F",
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    borderRadius: 10,
                    padding: "13px",
                    cursor: "pointer",
                  }}
                >
                  Đăng nhập
                </button>
              </form>
            </>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="0912345678"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="email@example.com"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Mật khẩu (tối thiểu 6 ký tự) *
                  </label>
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="••••••"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Vai trò đăng ký *
                  </label>
                  <select
                    value={regForm.role}
                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value as "customer" | "owner" })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  >
                    <option value="customer">Khách hàng (Đặt lịch)</option>
                    <option value="owner">Chủ Salon (Đối tác)</option>
                  </select>
                </div>
              </div>

              {regForm.role === "customer" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Địa chỉ (Theo Biểu đồ lớp 2.16)
                    </label>
                    <input
                      type="text"
                      value={regForm.address}
                      onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                      placeholder="Số nhà, đường, quận..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={regForm.birthDate}
                      onChange={(e) => setRegForm({ ...regForm, birthDate: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Tên cơ sở Salon *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.salonName}
                      onChange={(e) => setRegForm({ ...regForm, salonName: e.target.value })}
                      placeholder="VD: Royal Barber Shop"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Khu vực
                    </label>
                    <select
                      value={regForm.district}
                      onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                    >
                      {["Hoàn Kiếm", "Đống Đa", "Cầu Giấy", "Hai Bà Trưng", "Tây Hồ", "Ba Đình"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{
                  marginTop: 8,
                  backgroundColor: "#C8923B",
                  color: "#14110F",
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  borderRadius: 10,
                  padding: "13px",
                  cursor: "pointer",
                }}
              >
                Tạo tài khoản
              </button>
            </form>
          )}

          {tab === "profile" && currentUser && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {currentUser.role === "customer" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    padding: "12px",
                    borderRadius: 12,
                    backgroundColor: "rgba(200,146,59,0.1)",
                    border: "1px solid rgba(200,146,59,0.25)",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#14110F" }}>{completedCount}</div>
                    <div style={{ fontSize: 11, color: "#8A8178" }}>Lượt đã cắt</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#C8923B" }}>{loyaltyPoints}</div>
                    <div style={{ fontSize: 11, color: "#8A8178" }}>Điểm thưởng</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#14110F", marginTop: 4 }}>{memberTier}</div>
                    <div style={{ fontSize: 11, color: "#8A8178" }}>Hạng thẻ</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      backgroundColor: "#C8923B",
                      color: "#14110F",
                      fontWeight: 700,
                      fontSize: 14,
                      border: "none",
                      borderRadius: 10,
                      padding: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setAuthModalOpen(false);
                    }}
                    style={{
                      backgroundColor: "rgba(181,72,58,0.12)",
                      color: "#B5483A",
                      fontWeight: 700,
                      fontSize: 14,
                      border: "1px solid rgba(181,72,58,0.3)",
                      borderRadius: 10,
                      padding: "12px 18px",
                      cursor: "pointer",
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              </form>

              <form
                onSubmit={handlePasswordChange}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(31,26,23,0.1)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#14110F" }}>Đổi mật khẩu</div>
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu hiện tại"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mật khẩu mới (≥ 6 ký tự)"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Nhập lại mật khẩu mới"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#14110F",
                    color: "#F6F1E7",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px",
                    cursor: "pointer",
                  }}
                >
                  Cập nhật mật khẩu
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

