const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 .-]{8,20}$/;
const CONTACT_VIA = ['zalo', 'facebook', 'phone'];
const STATUSES = ['new', 'contacted', 'closed'];

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Form "Đăng ký tư vấn" trên trang chủ - công khai nên giới hạn số lần gửi theo IP.
const submitLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: { error: 'Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút.' } });

router.post('/', submitLimit, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = str(body.name, 100);
  const phone = str(body.phone, 20);
  const email = str(body.email, 120).toLowerCase();
  if (!name) return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email không hợp lệ' });
  const item = await db.insert('consultations', {
    name, phone, email,
    contactVia: CONTACT_VIA.includes(body.contactVia) ? body.contactVia : 'zalo',
    interest: str(body.interest, 80),
    message: str(body.message, 1000),
    status: 'new',
    note: ''
  });
  res.status(201).json({ id: item.id });
}));

router.get('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const items = await db.all('consultations');
  res.json([...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
}));

router.patch('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const patch = {};
  if (STATUSES.includes(req.body?.status)) patch.status = req.body.status;
  if (typeof req.body?.note === 'string') patch.note = req.body.note.slice(0, 1000);
  const updated = await db.update('consultations', req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(updated);
}));

router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const ok = await db.remove('consultations', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({ ok: true });
}));

module.exports = router;
