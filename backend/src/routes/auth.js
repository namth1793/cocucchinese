const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const MAX_DEVICES = 2;

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Vui lòng nhập đủ họ tên, email và mật khẩu (tối thiểu 6 ký tự)' });
  }
  if (db.findWhere('users', (u) => u.email === email)[0]) {
    return res.status(409).json({ error: 'Email đã được sử dụng' });
  }
  const user = db.insert('users', {
    name, email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'student', status: 'active', activeSessions: []
  });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

function issueSession(user, req) {
  const jti = crypto.randomUUID();
  const sessions = [...(user.activeSessions || [])];
  sessions.push({ jti, device: (req.headers['user-agent'] || 'unknown').slice(0, 120), ip: req.ip, createdAt: new Date().toISOString() });
  while (sessions.length > MAX_DEVICES) sessions.shift();
  db.update('users', user.id, { activeSessions: sessions });
  return jwt.sign({ sub: user.id, jti, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.findWhere('users', (u) => u.email === email)[0];
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  }
  if (user.status === 'locked') return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
  const token = issueSession(user, req);
  db.logActivity(user.id, 'login', { ip: req.ip });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/logout', requireAuth, (req, res) => {
  const user = db.find('users', req.user.id);
  const sessions = (user.activeSessions || []).filter((s) => s.jti !== req.jti);
  db.update('users', user.id, { activeSessions: sessions });
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => res.json(req.user));

module.exports = router;
