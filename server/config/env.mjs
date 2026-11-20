import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(ROOT_DIR, ".env") });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 4000,
  MONGO_URI: process.env.MONGO_URI || "",
  // Mặc định FALSE để tránh mất dữ liệu im lặng khi MongoDB chưa chạy; chỉ bật true rõ ràng ở dev/demo
  MEMORY_DB_FALLBACK: process.env.MEMORY_DB_FALLBACK === "true",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 10,
  VNP_TMN_CODE: process.env.VNP_TMN_CODE || "",
  VNP_HASH_SECRET: process.env.VNP_HASH_SECRET || "",
  VNP_URL: process.env.VNP_URL || "",
  VNP_RETURN_URL: process.env.VNP_RETURN_URL || "",
  // Chỉ bật mô phỏng VNPay khi có cờ tường minh và KHÔNG phải production
  VNP_SIMULATE:
    process.env.VNP_SIMULATE === "true" && (process.env.NODE_ENV || "development") !== "production",
  ALLOWED_ORIGINS: [
    ...(
      process.env.ALLOWED_ORIGINS ||
      "http://localhost:5173,http://localhost:4000,http://127.0.0.1:5173,https://sonrise.id.vn,https://www.sonrise.id.vn"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL.trim()] : []),
  ],
  DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY || "",
};

// Fail-fast: từ chối khởi động nếu thiếu JWT_SECRET
if (!env.JWT_SECRET) {
  throw new Error("[env] Thiếu biến môi trường bắt buộc JWT_SECRET trong .env. Dừng khởi động server.");
}
