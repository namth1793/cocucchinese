/**
 * Script chạy TAY để đặt lại mật khẩu 1 tài khoản (dùng khi quên mật khẩu admin,
 * không vào được trang quản trị để tự đặt lại).
 *
 * Cách dùng (mật khẩu mới ≥ 6 ký tự):
 *   node src/resetPassword.js <email> <mật-khẩu-mới>
 *
 * Chạy với PostgreSQL thật trên Railway: đặt DATABASE_URL = chuỗi kết nối CÔNG KHAI
 * (DATABASE_PUBLIC_URL trong Variables của service Postgres - chuỗi nội bộ
 * postgres.railway.internal không truy cập được từ máy cá nhân), ví dụ Git Bash:
 *   DATABASE_URL="postgresql://..." node src/resetPassword.js admin@hsk360.vn MatKhauMoi123
 *
 * Đồng thời xoá mọi phiên đăng nhập cũ của tài khoản và mở khoá nếu đang bị khoá.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
const access = require('./utils/access');

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 6) {
    console.error('Cách dùng: node src/resetPassword.js <email> <mật-khẩu-mới ≥ 6 ký tự>');
    process.exit(1);
  }
  console.log(`Dữ liệu: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'file JSON (chưa đặt DATABASE_URL)'}`);
  const wanted = access.normalizeEmail(email);
  const user = (await db.findWhere('users', (u) => access.normalizeEmail(u.email) === wanted))[0];
  if (!user) {
    const admins = await db.findWhere('users', (u) => u.role === 'admin');
    console.error(`Không tìm thấy tài khoản ${email}.`);
    console.error('Các tài khoản admin hiện có:', admins.map((u) => u.email).join(', ') || '(không có)');
    process.exit(1);
  }
  await db.update('users', user.id, {
    passwordHash: bcrypt.hashSync(password, 10),
    activeSessions: [],
    status: user.status === 'locked' ? 'active' : user.status
  });
  console.log(`Đã đặt lại mật khẩu cho ${user.email} (vai trò: ${user.role}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
