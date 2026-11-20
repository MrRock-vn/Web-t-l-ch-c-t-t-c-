import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.USE_MEMORY_DB = "1";

import { app, connectDB } from "../app.mjs";
import { disconnectDB } from "../config/db.mjs";
import { seedDatabase } from "../seed.mjs";
import { resetRateLimiter, safeRedirectPath } from "../middleware/security.mjs";
import { encryptSensitive, decryptSensitive, timingSafeHexEqual } from "../utils/crypto.mjs";

let customerToken = "";
let owner1Token = "";

test.before(async () => {
  await connectDB({ autoSeed: false });
  await seedDatabase();
  resetRateLimiter();

  const [cRes, oRes] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "khachhang@barberspa.vn", password: "123456" }),
    request(app).post("/api/auth/login").send({ email: "owner@barberspa.vn", password: "owner123" }),
  ]);
  customerToken = cRes.body.token;
  owner1Token = oRes.body.token;
});

test.after(async () => {
  await disconnectDB();
});

// ============================================================================
// OWASP #1: Injection (NoSQL Injection & Prototype Pollution)
// ============================================================================
test("OWASP #1 (Injection): Chặn NoSQL operator ($ne, $gt) và dot-notation", async () => {
  const sqli = await request(app)
    .post("/api/auth/login")
    .send({ email: { $ne: "" }, password: { $ne: "" } });
  assert.equal(sqli.status, 400);
  assert.match(sqli.body.error, /NoSQL Injection/i);

  const queryInject = await request(app).get("/api/salons?district[$ne]=abc");
  assert.equal(queryInject.status, 400);
});

// ============================================================================
// OWASP #2: Cross-Site Scripting (XSS)
// ============================================================================
test("OWASP #2 (XSS): Làm sạch thẻ <script>, event handler và URL javascript:", async () => {
  const res = await request(app)
    .put("/api/auth/profile")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      name: 'Hoàng Tuấn <script>alert("xss")</script><img src=x onerror=alert(1)>',
      address: "Hà Nội",
    });
  assert.equal(res.status, 200);
  assert.ok(!res.body.user.name.includes("<script>"));
  assert.ok(!res.body.user.name.includes("onerror"));
  assert.ok(res.body.user.name.includes("Hoàng Tuấn"));
});

// ============================================================================
// OWASP #3: Broken Authentication & Session Management
// ============================================================================
test("OWASP #3 (Broken Auth & Session): Thu hồi JWT khi logout và Rate-limit chống Brute-force", async () => {
  // 1. Đăng nhập lấy token mới -> logout -> token cũ không dùng lại được
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "khachhang@barberspa.vn", password: "123456" });
  const tempToken = loginRes.body.token;

  const logoutRes = await request(app)
    .post("/api/auth/logout")
    .set("Authorization", `Bearer ${tempToken}`);
  assert.equal(logoutRes.status, 200);

  const reuseRes = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${tempToken}`);
  assert.equal(reuseRes.status, 401);

  // 2. Rate limiting chống brute-force (> 15 lần thử liên tiếp -> 429)
  resetRateLimiter();
  let lastStatus = 0;
  for (let i = 0; i < 16; i++) {
    const r = await request(app)
      .post("/api/auth/login")
      .send({ email: "bruteforce@barberspa.vn", password: "wrong" });
    lastStatus = r.status;
  }
  assert.equal(lastStatus, 429);
  resetRateLimiter();
});

// ============================================================================
// OWASP #4: Insecure Direct Object References (IDOR)
// ============================================================================
test("OWASP #4 (IDOR): Chặn truy cập/sửa tài nguyên của người dùng hoặc salon khác", async () => {
  // Chủ salon 1 không thể sửa salon 2
  const res = await request(app)
    .put("/api/salons/2")
    .set("Authorization", `Bearer ${owner1Token}`)
    .send({ name: "Hijacked" });
  assert.equal(res.status, 403);
});

// ============================================================================
// OWASP #5: Cross-Site Request Forgery (CSRF)
// ============================================================================
test("OWASP #5 (CSRF): Chặn Origin lạ và kiểm tra Double-Submit CSRF Token", async () => {
  // 1. Chặn request ghi từ Origin lạ
  const badOrigin = await request(app)
    .put("/api/auth/profile")
    .set("Authorization", `Bearer ${customerToken}`)
    .set("Origin", "https://evil-attacker.com")
    .send({ address: "Hacked" });
  assert.equal(badOrigin.status, 403);

  // 2. Lấy CSRF token từ /api/auth/csrf-token
  const csrfRes = await request(app).get("/api/auth/csrf-token");
  assert.equal(csrfRes.status, 200);
  const csrfToken = csrfRes.body.csrfToken;
  const cookieHeader = csrfRes.headers["set-cookie"][0].split(";")[0];

  // Có cookie XSRF-TOKEN nhưng thiếu header X-CSRF-Token -> bị chặn 403
  const missingHeader = await request(app)
    .put("/api/auth/profile")
    .set("Authorization", `Bearer ${customerToken}`)
    .set("Cookie", cookieHeader)
    .send({ address: "No CSRF Header" });
  assert.equal(missingHeader.status, 403);

  // Có cả cookie + header khớp -> 200 OK
  const validCsrf = await request(app)
    .put("/api/auth/profile")
    .set("Authorization", `Bearer ${customerToken}`)
    .set("Cookie", cookieHeader)
    .set("X-CSRF-Token", csrfToken)
    .send({ address: "15 Phố Huế, Hà Nội" });
  assert.equal(validCsrf.status, 200);
});

// ============================================================================
// OWASP #6: Security Misconfiguration
// ============================================================================
test("OWASP #6 (Security Misconfiguration): Ẩn X-Powered-By và trả đầy đủ Security Headers", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.headers["x-powered-by"], undefined);
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.equal(res.headers["x-frame-options"], "DENY");
  assert.ok(res.headers["content-security-policy"]);
  assert.equal(res.headers["referrer-policy"], "strict-origin-when-cross-origin");
});

// ============================================================================
// OWASP #7: Insecure Cryptographic Storage
// ============================================================================
test("OWASP #7 (Cryptographic Storage): Mã hóa AES-256-GCM và so sánh timing-safe", () => {
  const secret = "VNP20261120_SENSITIVE_DATA";
  const cipher1 = encryptSensitive(secret);
  const cipher2 = encryptSensitive(secret);

  assert.ok(cipher1.startsWith("enc:v1:"));
  assert.notEqual(cipher1, cipher2); // IV ngẫu nhiên mỗi lần mã hóa
  assert.equal(decryptSensitive(cipher1), secret);
  assert.equal(decryptSensitive(cipher2), secret);

  assert.equal(timingSafeHexEqual("aabbcc", "AABBCC"), true);
  assert.equal(timingSafeHexEqual("aabbcc", "aabbcd"), false);
});

// ============================================================================
// OWASP #8: Failure to Restrict URL Access
// ============================================================================
test("OWASP #8 (Restrict URL Access): Chặn truy cập URL admin và tệp cấu hình nhạy cảm", async () => {
  const envAttempt = await request(app).get("/.env");
  assert.equal(envAttempt.status, 403);

  const pkgAttempt = await request(app).get("/package.json");
  assert.equal(pkgAttempt.status, 403);

  const adminAttempt = await request(app)
    .get("/api/admin/overview")
    .set("Authorization", `Bearer ${customerToken}`);
  assert.equal(adminAttempt.status, 403);
});

// ============================================================================
// OWASP #9: Insufficient Transport Layer Protection
// ============================================================================
test("OWASP #9 (Transport Layer): Gắn header HSTS và Cache-Control: no-store cho route nhạy cảm", async () => {
  const res = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${customerToken}`);
  assert.equal(res.status, 200);
  assert.match(res.headers["strict-transport-security"], /max-age=31536000/);
  assert.match(res.headers["cache-control"], /no-store/);
});

// ============================================================================
// OWASP #10: Unvalidated Redirects and Forwards
// ============================================================================
test("OWASP #10 (Unvalidated Redirects): Chặn Open Redirect trên callback thanh toán", async () => {
  assert.equal(safeRedirectPath("https://evil.com/phish"), "/");
  assert.equal(safeRedirectPath("//evil.com"), "/");
  assert.equal(safeRedirectPath("javascript:alert(1)"), "/");
  assert.equal(safeRedirectPath("/bookings"), "/bookings");

  const redirRes = await request(app).get(
    "/api/payments/vnpay/return?returnTo=https://evil.com&vnp_SecureHash=BAD"
  );
  assert.equal(redirRes.status, 302);
  assert.ok(redirRes.headers.location.startsWith("/?payment="));
  assert.ok(!redirRes.headers.location.includes("evil.com"));
});
