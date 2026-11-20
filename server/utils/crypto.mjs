import crypto from "node:crypto";
import { env } from "../config/env.mjs";

const ALGORITHM = "aes-256-gcm";

/**
 * Suy dẫn khóa 32-byte (256-bit) từ DATA_ENCRYPTION_KEY trong .env bằng SHA-256.
 */
function getAesKey() {
  const secret = env.DATA_ENCRYPTION_KEY || env.JWT_SECRET || "barber_spa_fallback_dev_key_2026";
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

/**
 * Mã hóa dữ liệu nhạy cảm bằng AES-256-GCM (có IV ngẫu nhiên 12-byte và AuthTag 16-byte).
 * Định dạng lưu trữ: `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encryptSensitive(plainText) {
  if (plainText === undefined || plainText === null || plainText === "") return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getAesKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Giải mã chuỗi đã mã hóa bằng AES-256-GCM.
 */
export function decryptSensitive(encoded) {
  if (!encoded || typeof encoded !== "string" || !encoded.startsWith("enc:v1:")) {
    return encoded || "";
  }
  const [, , ivHex, tagHex, dataHex] = encoded.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, getAesKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * So sánh 2 chuỗi hex (như chữ ký HMAC-SHA512) theo thời gian hằng số
 * để phòng chống tấn công Timing Attack.
 */
export function timingSafeHexEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length === 0 || b.length === 0) {
    return false;
  }
  const bufA = Buffer.from(a.toLowerCase(), "utf8");
  const bufB = Buffer.from(b.toLowerCase(), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
