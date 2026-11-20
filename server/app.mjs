import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

import { env } from "./config/env.mjs";
import { connectDB, getDbMode } from "./config/db.mjs";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.mjs";
import {
  preventNoSqlInjection,
  sanitizeXss,
  csrfProtection,
  securityHeaders,
  enforceHttps,
  restrictSensitiveUrls,
} from "./middleware/security.mjs";

import authRoutes from "./routes/authRoutes.mjs";
import salonRoutes from "./routes/salonRoutes.mjs";
import bookingRoutes from "./routes/bookingRoutes.mjs";
import reviewRoutes from "./routes/reviewRoutes.mjs";
import paymentRoutes from "./routes/paymentRoutes.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import voucherRoutes from "./routes/voucherRoutes.mjs";
import notificationRoutes from "./routes/notificationRoutes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "..", "dist");

const app = express();

// Tin tưởng reverse proxy (Render/Nginx) để nhận diện đúng HTTPS (x-forwarded-proto) và IP thật
app.set("trust proxy", 1);

// 6. Security Misconfiguration: Ẩn header X-Powered-By
app.disable("x-powered-by");

// 9. Transport Layer Protection: Bắt buộc HTTPS ở production + HSTS + Security Headers
app.use(enforceHttps);
app.use(securityHeaders);

// 8. Chặn truy cập URL tệp cấu hình / mã nguồn nhạy cảm
app.use(restrictSensitiveUrls);

// 6. CORS theo danh sách nguồn tin cậy (ALLOWED_ORIGINS)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// 6. Giới hạn kích thước JSON payload chống DoS
app.use(express.json({ limit: "100kb" }));

// 1, 2, 5. Chống NoSQL Injection, XSS và CSRF
app.use(preventNoSqlInjection);
app.use(sanitizeXss);
app.use(csrfProtection);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "barber-spa-api",
    dbMode: getDbMode(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api", salonRoutes);
app.use("/api", bookingRoutes);
app.use("/api", reviewRoutes);
app.use("/api", paymentRoutes);
app.use("/api", voucherRoutes);
app.use("/api", notificationRoutes);
app.use("/api/admin", adminRoutes);

// 404 cho các route /api không khớp
app.use("/api", notFoundHandler);

// Serve static build từ dist/ khi deploy production
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

// Unified error handler ({ error: "..." })
app.use(errorHandler);

export { app, connectDB };
export default app;

// Chỉ listen khi chạy trực tiếp `node server/app.mjs` hoặc `nodemon server/app.mjs`
const isMain =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isMain) {
  connectDB()
    .then(() => {
      app.listen(env.PORT, () => {
        console.log(
          `[server] Barber Spa Express API đang chạy tại http://localhost:${env.PORT} (DB: ${getDbMode()})`
        );
      });
    })
    .catch((err) => {
      console.error("[server] Khởi động thất bại:", err);
      process.exit(1);
    });
}
