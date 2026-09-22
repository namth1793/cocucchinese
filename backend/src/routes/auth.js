const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const MAX_DEVICES = 2;

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
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) {
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  }
  if (user.status === 'locked') return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
  if (!(await access.hasAnyAccess(user))) {
    return res.status(403).json({
      error: 'Email này chưa được cấp quyền truy cập khoá học nào. Vui lòng đăng ký/thanh toán một khoá học hoặc liên hệ quản trị viên.',
      code: 'NO_COURSE_ACCESS'
    });
  }
  const token = await issueSession(user, req);
  await db.logActivity(user.id, 'login', { ip: req.ip });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  const user = await db.find('users', req.user.id);
  const sessions = (user.activeSessions || []).filter((s) => s.jti !== req.jti);
  await db.update('users', user.id, { activeSessions: sessions });
  res.json({ success: true });
}));

router.get('/me', requireAuth, (req, res) => res.json(req.user));

module.exports = router;
