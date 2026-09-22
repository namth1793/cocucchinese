const fs = require('fs');
const path = require('path');
const db = require('./db');
const storage = require('./storage');
const access = require('./utils/access');

/**
 * Migration chạy 1 lần (đánh dấu trong collection `migrations`) khi nâng cấp lên mô hình
 * "mua khoá học -> cấp quyền theo email":
 *  1. Học viên đã có sẵn từ trước (khi còn cho đăng ký tự do) được giữ nguyên quyền
 *     bằng cách cấp enrollment cho mọi khoá hiện có - nếu không họ sẽ bị khoá khỏi hệ
 *     thống. Admin có thể thu hồi từng khoá ở trang Quản trị > Học viên.
 *  2. Gán học phí mẫu cho các cấp độ HSK 1-6 đã có nội dung (từ 5 bài trở lên) để trang
 *     danh sách khoá học có dữ liệu hiển thị ngay. Đây chỉ là số mẫu, admin sửa/gỡ ở
 *     trang chỉnh sửa cấp độ; khoá chưa đủ nội dung không bị đem ra bán.
 */
const MIN_LESSONS_TO_SELL = 5;
const SAMPLE_PRICES = { HSK1: 499000, HSK2: 599000, HSK3: 699000, HSK4: 899000, HSK5: 1099000, HSK6: 1299000 };

async function runMigrations() {
  const key = 'course-access-v1';
  if ((await db.findWhere('migrations', (m) => m.key === key))[0]) return;

  const levels = await db.all('levels');
  const students = await db.findWhere('users', (u) => u.role === 'student');
  let granted = 0;
  for (const u of students) {
    for (const lv of levels) {
      const has = (await db.findWhere('enrollments', (e) => e.userId === u.id && e.levelId === lv.id))[0];
      if (has) continue;
      await db.insert('enrollments', {
        userId: u.id, email: access.normalizeEmail(u.email), levelId: lv.id,
        status: 'purchased', grantedAt: new Date().toISOString(), note: 'Chuyển từ tài khoản cũ (trước khi có phân quyền theo khoá)'
      });
      granted += 1;
    }
  }

  for (const lv of levels) {
    const code = String(lv.code || '').toUpperCase();
    const lessonCount = (await db.findWhere('lessons', (l) => l.levelId === lv.id)).length;
    if (lv.price === undefined && SAMPLE_PRICES[code] && lessonCount >= MIN_LESSONS_TO_SELL) {
      await db.update('levels', lv.id, { price: SAMPLE_PRICES[code] });
    }
  }

  await db.insert('migrations', { key, ranAt: new Date().toISOString() });
  console.log(`[migrate] ${key}: cấp ${granted} quyền cho ${students.length} học viên cũ, gán học phí mẫu cho các khoá HSK đã có nội dung`);
}

/**
 * Ảnh bìa mặc định (bìa sách tương ứng từng cấp độ) nằm ở backend/seed-assets/covers/<MÃ CẤP ĐỘ>.<đuôi>.
 * Chạy 1 lần: cấp độ nào chưa có coverUrl thì nạp ảnh qua storage (ổ đĩa local hoặc R2 - cùng 1 đường
 * đi như khi admin tự upload), nên hoạt động ở cả 2 chế độ lưu trữ. Admin thay ảnh bất kỳ lúc nào ở
 * trang chỉnh sửa cấp độ.
 */
const COVER_DIR = path.join(__dirname, '..', 'seed-assets', 'covers');
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

async function applyDefaultCovers() {
  const key = 'level-covers-v1';
  if ((await db.findWhere('migrations', (m) => m.key === key))[0]) return;
  if (!fs.existsSync(COVER_DIR)) return;

  const files = fs.readdirSync(COVER_DIR);
  let applied = 0;
  for (const lv of await db.all('levels')) {
    if (lv.coverUrl) continue;
    const file = files.find((f) => path.basename(f, path.extname(f)).toUpperCase() === String(lv.code || '').toUpperCase());
    if (!file) continue;
    const ext = path.extname(file).toLowerCase();
    const { url } = await storage.saveCover(fs.readFileSync(path.join(COVER_DIR, file)), file, MIME[ext] || 'image/jpeg');
    await db.update('levels', lv.id, { coverUrl: url });
    applied += 1;
  }
  await db.insert('migrations', { key, ranAt: new Date().toISOString() });
  console.log(`[migrate] ${key}: nạp ${applied} ảnh bìa mặc định`);
}

module.exports = { runMigrations, applyDefaultCovers };
