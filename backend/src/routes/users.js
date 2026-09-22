const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const svc = require('../services/enrollmentService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const users = (await db.all('users')).map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    status: u.status, sessions: (u.activeSessions || []).length, createdAt: u.createdAt
  }));
  res.json(users);
}));

router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (await svc.findUserByEmail(email)) return res.status(409).json({ error: 'Email đã tồn tại' });
  const user = await db.insert('users', {
    name, email,
    passwordHash: bcrypt.hashSync(password || '123456', 10),
    role: role === 'admin' ? 'admin' : (role === 'teacher' ? 'teacher' : 'student'),
    status: 'active', activeSessions: []
  });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
}));

router.put('/:id/status', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'locked'].includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  const patch = { status };
  if (status === 'locked') patch.activeSessions = [];
  const user = await db.update('users', req.params.id, patch);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
  await db.logActivity(req.user.id, 'user_status_change', { targetUser: req.params.id, status });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
}));

// Cấp lại mật khẩu tạm (học viên quên mật khẩu) - trả về 1 lần để admin gửi cho học viên.
router.post('/:id/reset-password', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const target = await db.find('users', req.params.id);
  if (!target) return res.status(404).json({ error: 'Không tìm thấy' });
  const tempPassword = svc.randomPassword();
  await db.update('users', target.id, { passwordHash: bcrypt.hashSync(tempPassword, 10), activeSessions: [] });
  await db.logActivity(req.user.id, 'user_reset_password', { targetUser: target.id });
  res.json({ email: target.email, tempPassword });
}));

router.get('/logs/all', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  res.json((await db.all('activityLogs')).slice(-300).reverse());
}));

module.exports = router;
