import { useState } from "react";
import {
  Shield,
  Users,
  Store,
  FolderTree,
  Flag,
  CreditCard,
  Database,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function AdminDashboard() {
  const {
    users,
    salons,
    categories,
    services,
    barbers,
    bookings,
    payments,
    reviews,
    toggleUserLock,
    toggleSalonStatus,
    addCategory,
    deleteCategory,
    moderateReview,
    processRefundAdmin,
    setActiveView,
  } = useApp();

  const [tab, setTab] = useState<
    "overview" | "users" | "salons" | "categories" | "moderation" | "refunds" | "nosql"
  >("overview");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("bookings");

  const reportedReviews = reviews.filter((r) => r.reported || r.hidden);
  const refundRequests = bookings.filter((b) => b.paymentStatus === "refund_requested");
  const totalPlatformRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const handleLockToggle = async (uid: number) => {
    const res = await toggleUserLock(uid);
    if (!res.ok) {
      setNotice({ type: "err", text: res.error || "Không thể khóa tài khoản." });
    } else {
      setNotice({ type: "ok", text: "Đã cập nhật trạng thái hoạt động của tài khoản!" });
    }
  };

  const handleDeleteCategory = async (cid: string) => {
    const res = await deleteCategory(cid);
    if (!res.ok) {
      setNotice({ type: "err", text: res.error || "Không thể xóa danh mục." });
    } else {
      setNotice({ type: "ok", text: "Đã xóa danh mục dịch vụ." });
    }
  };

  const collectionsMap: Record<string, unknown[]> = {
    users,
    salons,
    categories,
    services,
    barbers,
    bookings,
    payments,
    reviews,
  };

  return (
    <section style={{ backgroundColor: "#F6F1E7", minHeight: "100vh", padding: "104px 24px 72px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: "#14110F",
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 28,
            border: "1px solid rgba(200,146,59,0.28)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <span
              style={{
                backgroundColor: "rgba(200,146,59,0.16)",
                border: "1px solid rgba(200,146,59,0.4)",
                color: "#C8923B",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 100,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Use Case 2.8 · Quản trị viên Hệ thống (Admin)
            </span>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30,
                fontWeight: 700,
                color: "#F6F1E7",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Trung tâm Quản trị{" "}
              <span style={{ color: "#C8923B", fontStyle: "italic" }}>Barber Spa</span>
            </h1>
          </div>

          <button
            onClick={() => setActiveView("landing")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(246,241,231,0.08)",
              border: "1px solid rgba(200,146,59,0.35)",
              color: "#F6F1E7",
              padding: "10px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} /> Về giao diện Khách hàng
          </button>
        </div>

        {notice && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderRadius: 12,
              marginBottom: 20,
              backgroundColor:
                notice.type === "ok" ? "rgba(110,139,116,0.16)" : "rgba(181,72,58,0.14)",
              border: `1px solid ${
                notice.type === "ok" ? "rgba(110,139,116,0.4)" : "rgba(181,72,58,0.4)"
              }`,
              color: notice.type === "ok" ? "#2F5B37" : "#B5483A",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {notice.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            <span style={{ flex: 1 }}>{notice.text}</span>
            <button
              onClick={() => setNotice(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { id: "overview", label: "Thống kê tổng quan", icon: Shield },
            { id: "users", label: `Người dùng (${users.length})`, icon: Users },
            { id: "salons", label: `Kiểm duyệt Salon (${salons.length})`, icon: Store },
            { id: "categories", label: `Danh mục dịch vụ (${categories.length})`, icon: FolderTree },
            { id: "moderation", label: `Báo cáo đánh giá (${reportedReviews.length})`, icon: Flag },
            { id: "refunds", label: `Hoàn tiền & Lịch hẹn (${refundRequests.length})`, icon: CreditCard },
            { id: "nosql", label: "CSDL NoSQL Collections", icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setNotice(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${active ? "#C8923B" : "rgba(31,26,23,0.12)"}`,
                  backgroundColor: active ? "#C8923B" : "#FDFAF4",
                  color: active ? "#14110F" : "#1F1A17",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            {[
              { label: "Tổng tài khoản hệ thống", value: users.length, sub: "Khách hàng, Chủ salon & Admin" },
              { label: "Tổng cơ sở Salon", value: salons.length, sub: `${salons.filter((s) => s.verified).length} cơ sở đã xác minh` },
              { label: "Tổng Lịch hẹn", value: bookings.length, sub: `${bookings.filter((b) => b.status === "completed").length} hoàn thành` },
              { label: "Tổng giá trị giao dịch", value: `${totalPlatformRevenue.toLocaleString("vi-VN")}₫`, sub: `${payments.length} giao dịch VNPay Sandbox` },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  backgroundColor: "#FDFAF4",
                  borderRadius: 18,
                  padding: 24,
                  border: "1px solid rgba(31,26,23,0.08)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8178", textTransform: "uppercase" }}>
                  {card.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 30,
                    fontWeight: 700,
                    color: "#C8923B",
                    marginTop: 8,
                  }}
                >
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: "#57504A", marginTop: 6 }}>{card.sub}</div>
              </div>
            ))}

            {/* Biểu đồ doanh thu & lượt đặt theo từng Salon */}
            {(() => {
              const salonStats = salons.map((s) => {
                const rev = bookings
                  .filter((b) => b.salonId === s.id && b.status !== "cancelled")
                  .reduce((sum, b) => sum + b.totalPrice, 0);
                const count = bookings.filter((b) => b.salonId === s.id && b.status !== "cancelled").length;
                return { id: s.id, name: s.name, district: s.district, rev, count };
              });
              const maxRev = Math.max(100000, ...salonStats.map((x) => x.rev));
              return (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "#FDFAF4",
                    padding: 24,
                    borderRadius: 16,
                    border: "1px solid rgba(31,26,23,0.08)",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#14110F", marginBottom: 16 }}>
                    Biểu đồ doanh thu theo từng cơ sở Salon
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {salonStats.map((item) => {
                      const pct = Math.max(4, Math.round((item.rev / maxRev) * 100));
                      return (
                        <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ fontWeight: 700, color: "#14110F" }}>
                              {item.name} <span style={{ color: "#8A8178", fontWeight: 400 }}>({item.district})</span>
                            </span>
                            <span style={{ fontWeight: 700, color: "#C8923B" }}>
                              {item.rev.toLocaleString("vi-VN")}₫ · {item.count} lịch
                            </span>
                          </div>
                          <div style={{ height: 10, borderRadius: 999, backgroundColor: "rgba(31,26,23,0.08)", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${item.rev > 0 ? pct : 0}%`,
                                height: "100%",
                                borderRadius: 999,
                                background: "linear-gradient(90deg, #C8923B 0%, #E0B262 100%)",
                                transition: "width 300ms ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* USERS MANAGEMENT */}
        {tab === "users" && (
          <div
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              border: "1px solid rgba(31,26,23,0.08)",
              padding: 24,
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>
              Quản lý Tài khoản Người dùng
            </h3>
            <p style={{ fontSize: 12, color: "#8A8178", marginBottom: 16 }}>
              * Kiểm tra Ngoại lệ 2.8.1: Nếu Admin bấm khóa tài khoản của chính mình, hệ thống sẽ từ chối thao tác.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(31,26,23,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {u.name}{" "}
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 100,
                          backgroundColor: "rgba(200,146,59,0.15)",
                          color: "#A9722A",
                          textTransform: "uppercase",
                        }}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#8A8178" }}>
                      Email: {u.email} · SĐT: {u.phone} · ObjectId: <code>{u._id}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLockToggle(u.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(31,26,23,0.2)",
                      backgroundColor: u.status === "active" ? "#fff" : "rgba(181,72,58,0.12)",
                      color: u.status === "active" ? "#14110F" : "#B5483A",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {u.status === "active" ? (
                      <>
                        <Lock size={13} /> Khóa tài khoản
                      </>
                    ) : (
                      <>
                        <Unlock size={13} /> Mở khóa
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SALONS MODERATION */}
        {tab === "salons" && (
          <div
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              border: "1px solid rgba(31,26,23,0.08)",
              padding: 24,
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 16 }}>
              Kiểm duyệt thông tin Salon đối tác
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {salons.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(31,26,23,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {s.name} ({s.district})
                    </div>
                    <div style={{ fontSize: 13, color: "#8A8178" }}>{s.address}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => toggleSalonStatus(s.id, "verified")}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: s.verified ? "rgba(110,139,116,0.2)" : "#C8923B",
                        color: "#14110F",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {s.verified ? "✓ Đã xác minh" : "Xác minh Salon"}
                    </button>
                    <button
                      onClick={() => toggleSalonStatus(s.id, "status")}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(181,72,58,0.35)",
                        backgroundColor: s.status === "hidden" ? "#B5483A" : "transparent",
                        color: s.status === "hidden" ? "#fff" : "#B5483A",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {s.status === "hidden" ? "Khôi phục hiển thị" : "Ẩn Salon vi phạm"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {tab === "categories" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCategory(catName, catDesc);
                setCatName("");
                setCatDesc("");
                setNotice({ type: "ok", text: "Đã thêm danh mục dịch vụ mới!" });
              }}
              style={{
                backgroundColor: "#FDFAF4",
                borderRadius: 18,
                padding: 24,
                border: "1px solid rgba(31,26,23,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                height: "fit-content",
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 }}>
                Thêm Danh mục chung
              </h3>
              <input
                type="text"
                required
                placeholder="Tên danh mục..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              />
              <textarea
                rows={2}
                placeholder="Mô tả danh mục..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(31,26,23,0.2)" }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#C8923B",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Thêm danh mục
              </button>
            </form>

            <div
              style={{
                backgroundColor: "#FDFAF4",
                borderRadius: 18,
                padding: 24,
                border: "1px solid rgba(31,26,23,0.08)",
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 6 }}>
                Danh mục dịch vụ toàn hệ thống
              </h3>
              <p style={{ fontSize: 12, color: "#8A8178", marginBottom: 14 }}>
                * Kiểm tra Ngoại lệ 2.8.1: Xóa danh mục còn dịch vụ đang sử dụng sẽ bị hệ thống từ chối.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {categories.map((c) => {
                  const count = services.filter((s) => s.categoryId === c.id).length;
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        backgroundColor: "#fff",
                        border: "1px solid rgba(31,26,23,0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#8A8178" }}>
                          {c.description} · Đang có <strong>{count}</strong> dịch vụ sử dụng
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(181,72,58,0.3)",
                          background: "rgba(181,72,58,0.08)",
                          color: "#B5483A",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODERATION OF REVIEWS */}
        {tab === "moderation" && (
          <div
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              padding: 24,
              border: "1px solid rgba(31,26,23,0.08)",
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 16 }}>
              Xử lý báo cáo đánh giá không phù hợp
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    border: `1px solid ${r.reported ? "#B5483A" : "rgba(31,26,23,0.08)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {r.name} ({r.salon}){" "}
                      {r.reported && (
                        <span style={{ color: "#B5483A", fontSize: 12 }}>
                          [Bị báo cáo: {r.reportReason}]
                        </span>
                      )}
                      {r.hidden && (
                        <span style={{ color: "#8A8178", fontSize: 12 }}> [Đã ẩn]</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#57504A", marginTop: 4 }}>"{r.text}"</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {r.reported && (
                      <button
                        onClick={() => moderateReview(r.id, "keep")}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(31,26,23,0.2)",
                          background: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Bỏ báo cáo
                      </button>
                    )}
                    <button
                      onClick={() => moderateReview(r.id, "hide")}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(200,146,59,0.4)",
                        background: "rgba(200,146,59,0.1)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {r.hidden ? "Khôi phục" : "Ẩn đánh giá"}
                    </button>
                    <button
                      onClick={() => moderateReview(r.id, "delete")}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#B5483A",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Xóa vĩnh viễn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REFUNDS & GLOBAL BOOKINGS */}
        {tab === "refunds" && (
          <div
            style={{
              backgroundColor: "#FDFAF4",
              borderRadius: 18,
              padding: 24,
              border: "1px solid rgba(31,26,23,0.08)",
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 16 }}>
              Duyệt hoàn tiền VNPay & Giám sát Lịch hẹn toàn hệ thống
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(31,26,23,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      [{b.id}] {b.customerName} → {b.salonName} ({b.totalPrice.toLocaleString("vi-VN")}₫)
                    </div>
                    <div style={{ fontSize: 12, color: "#8A8178", marginTop: 4 }}>
                      Ngày: {b.date} {b.time} · Trạng thái lịch: <strong>{b.status}</strong> · Thanh toán:{" "}
                      <strong>{b.paymentStatus}</strong>
                    </div>
                  </div>
                  {b.paymentStatus === "refund_requested" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          processRefundAdmin(b.id, true);
                          setNotice({ type: "ok", text: `Đã duyệt hoàn tiền VNPay cho lịch hẹn ${b.id}!` });
                        }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: "#6E8B74",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Duyệt hoàn tiền
                      </button>
                      <button
                        onClick={() => processRefundAdmin(b.id, false)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid rgba(181,72,58,0.4)",
                          background: "transparent",
                          color: "#B5483A",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOSQL COLLECTIONS VIEWER */}
        {tab === "nosql" && (
          <div
            style={{
              backgroundColor: "#14110F",
              borderRadius: 18,
              padding: 24,
              color: "#F6F1E7",
              border: "1px solid rgba(200,146,59,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#C8923B", margin: 0 }}>
                  Trình quản lý Cơ sở dữ liệu NoSQL (MongoDB Document Collections)
                </h3>
                <p style={{ fontSize: 13, color: "#8A8178", margin: "4px 0 0" }}>
                  Lưu trữ tại <code>server/data/collections/*.collection.json</code> (tương thích trực tiếp với MongoDB Compass)
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.keys(collectionsMap).map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedCollection(col)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${selectedCollection === col ? "#C8923B" : "rgba(246,241,231,0.2)"}`,
                      backgroundColor: selectedCollection === col ? "#C8923B" : "transparent",
                      color: selectedCollection === col ? "#14110F" : "#EDE8DE",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    db.{col} ({collectionsMap[col].length})
                  </button>
                ))}
              </div>
            </div>
            <pre
              style={{
                backgroundColor: "#1F1A17",
                padding: 18,
                borderRadius: 12,
                overflowX: "auto",
                maxHeight: 420,
                fontSize: 12,
                color: "#EDE8DE",
                border: "1px solid rgba(200,146,59,0.18)",
                margin: 0,
              }}
            >
              {JSON.stringify(collectionsMap[selectedCollection], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

