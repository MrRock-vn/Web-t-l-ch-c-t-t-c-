import crypto from "node:crypto";
import { env } from "../config/env.mjs";
import { badRequest, forbidden, HttpError } from "../utils/HttpError.mjs";

// ============================================================================
// 1. CHỐNG INJECTION (NoSQL Operator Injection & Prototype Pollution)
// ============================================================================
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function hasNoSqlInjection(value) {
  if (value === null || value === undefined || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => hasNoSqlInjection(item));
  }
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key) || key.startsWith("$") || key.includes(".")) {
      return true;
    }
    if (hasNoSqlInjection(value[key])) return true;
  }
  return false;
}

export function preventNoSqlInjection(req, _res, next) {
  if (
    hasNoSqlInjection(req.body) ||
    hasNoSqlInjection(req.query) ||
    hasNoSqlInjection(req.params)
  ) {
    return next(badRequest("Dữ liệu chứa toán tử không hợp lệ (chống NoSQL Injection)."));
  }
  next();
}

// ============================================================================
// 2. CHỐNG CROSS-SITE SCRIPTING (XSS)
// ============================================================================
const URL_FIELDS = new Set(["photo", "photoUrl", "returnUrl", "redirect"]);

function sanitizeString(str, fieldName = "") {
  let clean = str
    // Xóa thẻ thực thi nguy hiểm <script>, <iframe>, <object>, <embed>, <style>
    .replace(/<\s*(script|iframe|object|embed|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // Chỉ xóa thẻ HTML rõ ràng (có tên thẻ + thuộc tính hoặc dấu đóng), không làm hỏng biểu thức hợp lệ như "giá < 100k"
    .replace(/<\/?(?:script|iframe|object|embed|svg|img|body|html|link|meta|form|input|a)\b[^>]*>/gi, "")
    // Xóa thuộc tính sự kiện onerror=, onload=, onclick=...
    .replace(/\bon[a-z]+\s*=\s*(['"]?).*?\1/gi, "")
    // Xóa giao thức nguy hiểm javascript:, vbscript:, data:text/html
    .replace(/\b(javascript|vbscript)\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "");

  if (URL_FIELDS.has(fieldName)) {
    const trimmed = clean.trim();
    if (trimmed && !/^(https?:\/\/|\/)/i.test(trimmed)) {
      return "";
    }
  }
  return clean;
}

function sanitizeDeep(obj, fieldName = "") {
  if (typeof obj === "string") return sanitizeString(obj, fieldName);
  if (Array.isArray(obj)) return obj.map((v) => sanitizeDeep(v, fieldName));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (FORBIDDEN_KEYS.has(k)) continue;
      // Không sửa trường password để tránh làm sai mật khẩu chứa ký tự đặc biệt
      if (k === "password" || k === "passwordHash") {
        out[k] = v;
      } else {
        out[k] = sanitizeDeep(v, k);
      }
    }
    return out;
  }
  return obj;
}

export function sanitizeXss(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeDeep(req.body);
  }
  if (req.query && typeof req.query === "object") {
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === "string") {
        req.query[k] = sanitizeString(v, k);
      }
    }
  }
  next();
}

// ============================================================================
// 3. CHỐNG BROKEN AUTHENTICATION & SESSION MANAGEMENT
//    - Rate Limiting chống Brute-Force
//    - Token Blacklist (thu hồi JWT khi đăng xuất)
// ============================================================================
const loginAttempts = new Map(); // key -> { count, resetAt }

export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10, message } = {}) {
  return (req, res, next) => {
    const emailPart = String(req.body?.email || "").toLowerCase().trim();
    const key = `${req.ip || "local"}:${req.path}:${emailPart}`;
    const now = Date.now();
    const entry = loginAttempts.get(key);

    if (!entry || now > entry.resetAt) {
      loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return next(
        new HttpError(
          429,
          message || "Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau."
        )
      );
    }

    next();
  };
}

export function resetRateLimiter() {
  loginAttempts.clear();
}

// Danh sách JWT đã bị thu hồi (jti -> exp timestamp ms)
const revokedTokens = new Map();

export function revokeToken(jti, expSeconds) {
  if (!jti) return;
  const expiresAt = expSeconds ? expSeconds * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
  revokedTokens.set(jti, expiresAt);
}

export function isTokenRevoked(jti) {
  if (!jti) return false;
  const exp = revokedTokens.get(jti);
  if (!exp) return false;
  if (Date.now() > exp) {
    revokedTokens.delete(jti);
    return false;
  }
  return true;
}

// ============================================================================
// 5. CHỐNG CROSS-SITE REQUEST FORGERY (CSRF)
//    - Double-Submit Cookie (XSRF-TOKEN cookie + X-CSRF-Token header)
//    - Kiểm tra Origin / Referer whitelist cho request thay đổi trạng thái
// ============================================================================
function parseCookies(cookieHeader = "") {
  const cookies = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      cookies[k] = decodeURIComponent(v);
    }
  }
  return cookies;
}

export function issueCsrfToken(req, res) {
  const token = crypto.randomBytes(24).toString("hex");
  const isSecure = env.NODE_ENV === "production" || req.secure;
  const flags = [
    `XSRF-TOKEN=${encodeURIComponent(token)}`,
    "Path=/",
    "SameSite=Strict",
    ...(isSecure ? ["Secure"] : []),
  ];
  res.setHeader("Set-Cookie", flags.join("; "));
  res.json({ csrfToken: token });
}

export function csrfProtection(req, _res, next) {
  // Chỉ kiểm tra cho các phương thức thay đổi trạng thái
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // 1. Kiểm tra Origin / Referer (nếu trình duyệt gửi lên)
  const origin = req.headers.origin;
  if (origin && !env.ALLOWED_ORIGINS.includes(origin)) {
    return next(forbidden("Origin không hợp lệ (chống tấn công CSRF)."));
  }

  // 2. Nếu client có cookie XSRF-TOKEN, bắt buộc header X-CSRF-Token phải khớp (Double-Submit)
  const cookies = parseCookies(req.headers.cookie || "");
  if (cookies["XSRF-TOKEN"]) {
    const headerToken = String(req.headers["x-csrf-token"] || "");
    if (!headerToken || headerToken !== cookies["XSRF-TOKEN"]) {
      return next(forbidden("Thiếu hoặc sai mã CSRF token (X-CSRF-Token)."));
    }
  }

  next();
}

// ============================================================================
// 6 & 9. SECURITY MISCONFIGURATION + TRANSPORT LAYER PROTECTION
//    - Security Headers (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
//    - HSTS (Strict-Transport-Security) & HTTPS enforcement trong production
//    - No-Store cho route nhạy cảm
// ============================================================================
export function securityHeaders(req, res, next) {
  // Chống MIME Sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Chống Clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Kiểm soát Referrer
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Tắt quyền phần cứng không cần thiết
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  // Content Security Policy chống XSS
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  // 9. Transport Layer Protection (HSTS)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Không cache dữ liệu nhạy cảm ở trình duyệt / proxy trung gian
  if (
    req.path.startsWith("/api/auth") ||
    req.path.startsWith("/api/payments") ||
    req.path.startsWith("/api/admin")
  ) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
  }

  next();
}

export function enforceHttps(req, res, next) {
  if (env.NODE_ENV !== "production") return next();
  const proto = req.headers["x-forwarded-proto"];
  if (!req.secure && proto !== "https") {
    return res.status(403).json({
      error: "Kết nối không an toàn. Yêu cầu sử dụng giao thức HTTPS (TLS).",
    });
  }
  next();
}

// ============================================================================
// 8. CHỐNG FAILURE TO RESTRICT URL ACCESS (Chặn lộ file nhạy cảm qua URL)
// ============================================================================
const BLOCKED_URL_PATTERNS = [
  /\/\.(env|git|htaccess)/i,
  /\/(package\.json|package-lock\.json|tsconfig\.json)/i,
  /\/server\//i,
  /\.mjs$/i,
];

export function restrictSensitiveUrls(req, _res, next) {
  if (BLOCKED_URL_PATTERNS.some((re) => re.test(req.path))) {
    return next(forbidden("Không được phép truy cập tài nguyên hệ thống nhạy cảm."));
  }
  next();
}

// ============================================================================
// 10. CHỐNG UNVALIDATED REDIRECTS AND FORWARDS (Open Redirect)
// ============================================================================
export function safeRedirectPath(target, fallback = "/") {
  if (typeof target !== "string") return fallback;
  const trimmed = target.trim();
  // Chỉ cho phép đường dẫn tương đối nội bộ bắt đầu bằng 1 dấu "/"
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    /[\r\n]/.test(trimmed) ||
    /^[a-z]+:/i.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}
