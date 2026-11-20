import mongoose from "mongoose";
import { env } from "./env.mjs";
import { User } from "../models/index.mjs";
import { seedDatabase } from "../seed.mjs";

let memoryServer = null;
let connectionMode = "disconnected";

export function getDbMode() {
  return connectionMode;
}

/** Ẩn thông tin user:password trong URI trước khi ghi log (tránh lộ mật khẩu MongoDB Atlas) */
function maskMongoUri(uri = "") {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@/]+)@/i, "$1***:***@");
}

/**
 * Kết nối Mongoose tới MongoDB.
 * 1. Thử kết nối MONGO_URI thật (timeout 2.5s).
 * 2. Nếu thất bại và MEMORY_DB_FALLBACK=true (hoặc USE_MEMORY_DB=1 trong test) -> dùng mongodb-memory-server.
 * 3. Tự động seed dữ liệu mẫu nếu collection users đang trống.
 */
export async function connectDB({ autoSeed = true } = {}) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let connected = false;
  const forceMemory = process.env.USE_MEMORY_DB === "1";

  if (env.MONGO_URI && !forceMemory) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 2500,
      });
      connectionMode = "mongodb";
      connected = true;
      console.log(`[db] Đã kết nối MongoDB: ${maskMongoUri(env.MONGO_URI)}`);
    } catch (err) {
      if (!env.MEMORY_DB_FALLBACK) {
        console.error(
          `[db] Không thể kết nối MongoDB (${maskMongoUri(env.MONGO_URI)}): ${err.message}. ` +
            "Bật MEMORY_DB_FALLBACK=true trong .env nếu muốn chạy thử bằng DB in-memory."
        );
        throw err;
      }
      console.warn(
        `[db] Không kết nối được MongoDB (${err.message}). Chuyển sang MongoDB In-Memory (chế độ dev/demo)...`
      );
    }
  }

  if (!connected) {
    if (!forceMemory && !env.MEMORY_DB_FALLBACK) {
      throw new Error(
        "[db] Chưa cấu hình MONGO_URI và MEMORY_DB_FALLBACK=false. Không thể kết nối CSDL."
      );
    }
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    connectionMode = "memory";
    console.log("[db] Đã kết nối MongoDB In-Memory (chế độ dev/test)");
  }

  // Đảm bảo các index (kể cả partial unique index và Review.bookingId unique) được đồng bộ
  await mongoose.connection.syncIndexes();

  if (autoSeed) {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("[db] Database trống — tự động chạy seedDatabase()...");
      await seedDatabase();
    }
  }

  return mongoose.connection;
}

/** Ngắt kết nối Mongoose và dừng MongoMemoryServer */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  connectionMode = "disconnected";
}
