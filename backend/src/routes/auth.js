const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const MAX_DEVICES = 2;
// TẠM THỜI: tài khoản admin đăng nhập chỉ bằng email, không cần mật khẩu (theo yêu cầu chủ site).
// Bật lại kiểm tra mật khẩu: đặt biến môi trường ADMIN_PASSWORDLESS=0 rồi khởi động lại backend.
const ADMIN_PASSWORDLESS = process.env.ADMIN_PASSWORDLESS !== '0';

// Không có đăng ký tự do: tài khoản học viên chỉ được tạo khi admin xác nhận thanh toán
// (routes/orders.js) hoặc cấp quyền thủ công (routes/enrollments.js).

async function issueSession(user, req) {
  const jti = crypto.randomUUID();
  const sessions = [...(user.activeSessions || [])];
  sessions.push({ jti, device: (req.headers['user-agent'] || 'unknown').slice(0, 120), ip: req.ip, createdAt: new Date().toISOString() });
  while (sessions.length > MAX_DEVICES) sessions.shift();
  await db.update('users', user.id, { activeSessions: sessions });
  return jwt.sign({ sub: user.id, jti, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
}

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const wanted = access.normalizeEmail(email);
  const user = (await db.findWhere('users', (u) => access.normalizeEmail(u.email) === wanted))[0];
  const passwordless = ADMIN_PASSWORDLESS && user?.role === 'admin';
  if (!user || (!passwordless && !bcrypt.compareSync(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  }
  if (user.status === 'locked') return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
  if (user.status === 'pending') {
    return res.status(403).json({ error: 'Tài khoản của bạn đang chờ quản trị viên duyệt. Bạn sẽ đăng nhập được sau khi được duyệt.', code: 'ACCOUNT_PENDING' });
  }
  if (!(await access.hasAnyAccess(user))) {
    return res.status(403).json({
      error: 'Email này chưa được cấp quyền truy cập khoá học nào. Vui lòng đăng ký/thanh toán một khoá học hoặc liên hệ quản trị viên.',
      code: 'NO_COURSE_ACCESS'
    });
  }
  const token = await issueSession(user, req);
  await db.logActivity(user.id, 'login', { ip: req.ip, passwordless });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

// Tự đăng ký tài khoản học viên: tạo ở trạng thái "pending", chỉ đăng nhập được sau khi admin duyệt
// (trang Quản lý người dùng). Không tự đăng nhập, không cấp quyền khoá học.
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Bạn đăng ký quá nhiều lần, vui lòng thử lại sau.' } });
router.post('/register', registerLimit, asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 100);
  const email = access.normalizeEmail(req.body.email);
  const phone = String(req.body.phone || '').trim().slice(0, 30);
  const password = String(req.body.password || '');
  if (!name) return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email không hợp lệ' });
  if (password.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });
  const existing = (await db.findWhere('users', (u) => access.normalizeEmail(u.email) === email))[0];
  if (existing) {
    return res.status(409).json({
      error: existing.status === 'pending'
        ? 'Email này đã đăng ký và đang chờ quản trị viên duyệt.'
        : 'Email này đã có tài khoản. Vui lòng đăng nhập (quên mật khẩu thì liên hệ quản trị viên).'
    });
  }
  const user = await db.insert('users', {
    name, email, phone, passwordHash: bcrypt.hashSync(password, 10),
    role: 'student', status: 'pending', activeSessions: [], registeredAt: new Date().toISOString()
  });
  await db.logActivity(user.id, 'register', { email });
  res.status(201).json({ pending: true, email });
}));

router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  const user = await db.find('users', req.user.id);
  const sessions = (user.activeSessions || []).filter((s) => s.jti !== req.jti);
  await db.update('users', user.id, { activeSessions: sessions });
  res.json({ success: true });
}));

router.get('/me', requireAuth, (req, res) => res.json(req.user));

// Người dùng tự đổi mật khẩu (mọi vai trò). Giữ phiên hiện tại, đăng xuất các thiết bị khác.
router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  const user = await db.find('users', req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 đến 128 ký tự' });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
  }
  const sessions = (user.activeSessions || []).filter((s) => s.jti === req.jti);
  await db.update('users', user.id, { passwordHash: bcrypt.hashSync(newPassword, 10), activeSessions: sessions });
  await db.logActivity(user.id, 'change_password', { ip: req.ip });
  res.json({ success: true });
}));

module.exports = router;
