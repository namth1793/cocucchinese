/**
 * Chọn engine lưu trữ dữ liệu khi khởi động: mặc định dùng file JSON (không cần
 * cấu hình gì, phù hợp dev/demo). Khai báo DATABASE_URL trong backend/.env -> tự
 * động chuyển sang PostgreSQL, không cần đổi code ở nơi khác vì cả 2 engine
 * cùng interface (xem jsonStore.js / postgresStore.js). Cùng mẫu thiết kế với
 * backend/src/storage/index.js (local vs Cloudflare R2).
 */
module.exports = process.env.DATABASE_URL ? require('./postgresStore') : require('./jsonStore');
