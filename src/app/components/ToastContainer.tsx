import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 84,
        right: 20,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 380,
        width: "calc(100vw - 40px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const isErr = t.type === "error";
        const isInfo = t.type === "info";
        const accent = isErr ? "#D9534F" : isInfo ? "#3B82F6" : "#C8923B";

        return (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: "#14110F",
              color: "#F6F1E7",
              border: `1px solid ${accent}`,
              boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 13.5,
              lineHeight: 1.45,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              {isErr ? (
                <AlertCircle size={18} color="#F87171" />
              ) : isInfo ? (
                <Info size={18} color="#60A5FA" />
              ) : (
                <CheckCircle2 size={18} color="#C8923B" />
              )}
            </div>
            <div style={{ flex: 1 }}>{t.message}</div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Đóng thông báo"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(246,241,231,0.6)",
                cursor: "pointer",
                padding: 2,
                display: "flex",
              }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
