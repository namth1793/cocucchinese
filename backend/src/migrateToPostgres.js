/**
 * Script chạy TAY MỘT LẦN khi chuyển từ file JSON (backend/data/db.json) sang PostgreSQL.
 * Không tự chạy khi khởi động server (khác với migrate.js - các migration nội bộ vẫn
 * chạy tự động mỗi lần khởi động).
 *
 * Cách dùng:
 *   1. Tạo database PostgreSQL (Railway/DigitalOcean/tự cài...), lấy connection string.
 *   2. Khai báo DATABASE_URL trong backend/.env trỏ tới database đó.
 *   3. Chạy: node src/migrateToPostgres.js
 *      (tuỳ chọn: DATA_DIR=... nếu file db.json không nằm ở backend/data mặc định)
 *   4. Kiểm tra log "Hoàn tất" và đối chiếu số bản ghi mỗi collection.
 *   5. Khởi động lại backend bình thường (npm start) - từ giờ backend đọc/ghi thẳng
 *      vào Postgres vì đã có DATABASE_URL.
 *
 * An toàn chạy lại nhiều lần: dùng ON CONFLICT (id) DO NOTHING nên không tạo trùng
 * hay ghi đè dữ liệu đã có trong Postgres (không thay thế được thay đổi diễn ra bên
 * phía Postgres sau khi đã chuyển - đây là công cụ NHẬP dữ liệu ban đầu, không phải
 * đồng bộ 2 chiều).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL trong backend/.env - hãy khai báo trước khi chạy script này.');
  process.exit(1);
}

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Không tìm thấy ${DATA_FILE} - không có gì để chuyển.`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Yêu cầu postgresStore trực tiếp (không qua db/index.js) để chắc chắn dùng đúng
  // engine Postgres dù script này được gọi thế nào.
  const store = require('./db/postgresStore');
  await store.ensureSchema();

  console.log(`Đang nhập dữ liệu từ ${DATA_FILE} vào Postgres...`);
  let totalRows = 0;
  for (const collection of store.COLLECTIONS) {
    const items = Array.isArray(raw[collection]) ? raw[collection] : [];
    let inserted = 0;
    for (const item of items) {
      if (!item.id) continue; // bỏ qua bản ghi hỏng, không có id
      const { rowCount } = await store.pool.query(
        `INSERT INTO "${collection}" (id, data, created_at)
         VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (id) DO NOTHING`,
        [String(item.id), JSON.stringify(item), item.createdAt || new Date().toISOString()]
      );
      inserted += rowCount;
    }
    totalRows += inserted;
    console.log(`  ${collection}: ${inserted}/${items.length} bản ghi mới (còn lại đã tồn tại sẵn, bỏ qua)`);
  }

  await store.pool.end();
  console.log(`Hoàn tất. Đã nhập ${totalRows} bản ghi mới. Khởi động lại backend (npm start) để dùng Postgres.`);
}

main().catch((e) => {
  console.error('Nhập dữ liệu thất bại:', e);
  process.exit(1);
});
