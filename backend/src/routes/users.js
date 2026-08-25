const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const users = db.all('users').map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    status: u.status, sessions: (u.activeSessions || []).length, createdAt: u.createdAt
  }));
  res.json(users);
});

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (db.findWhere('users', (u) => u.email === email)[0]) return res.status(409).json({ error: 'Email đã tồn tại' });
  const user = db.insert('users', {
    name, email,
    passwordHash: bcrypt.hashSync(password || '123456', 10),
    role: role === 'admin' ? 'admin' : (role === 'teacher' ? 'teacher' : 'student'),
    status: 'active', activeSessions: []
  });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.put('/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'locked'].includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  const patch = { status };
  if (status === 'locked') patch.activeSessions = [];
  const user = db.update('users', req.params.id, patch);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
  db.logActivity(req.user.id, 'user_status_change', { targetUser: req.params.id, status });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
});

router.get('/logs/all', requireAuth, requireRole('admin'), (req, res) => {
  res.json(db.all('activityLogs').slice(-300).reverse());
});

module.exports = router;
