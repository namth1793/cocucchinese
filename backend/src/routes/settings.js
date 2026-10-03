const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Cấu hình kiểu chữ dùng chung toàn site (admin chỉnh ở /admin/typography). Phải khớp
// TYPOGRAPHY_DEFAULTS ở frontend/src/constants/typography.js.
const TYPOGRAPHY_DEFAULTS = {
  cnFont: 'Noto Serif SC', viFont: 'Be Vietnam Pro', baseSize: 15, lineHeight: 1.5,
  textColor: '#1F2937', hanziColor: '#1F2937', pinyinColor: '#D97706', meaningColor: '#6B7280',
  hanziWeight: 700, hanziScale: 1, pinyinScale: 1, meaningScale: 1, mobileHanziScale: 1
};

const RANGES = {
  baseSize: [12, 20], lineHeight: [1.2, 2.2], hanziWeight: [300, 900],
  hanziScale: [0.7, 2], pinyinScale: [0.7, 2], meaningScale: [0.7, 2], mobileHanziScale: [0.7, 1.6]
};
const COLOR_KEYS = ['textColor', 'hanziColor', 'pinyinColor', 'meaningColor'];

function sanitize(input) {
  const out = {};
  Object.entries(RANGES).forEach(([key, [min, max]]) => {
    const n = Number(input[key]);
    if (Number.isFinite(n)) out[key] = Math.min(max, Math.max(min, n));
  });
  COLOR_KEYS.forEach((key) => {
    if (typeof input[key] === 'string' && /^#[0-9a-fA-F]{6}$/.test(input[key])) out[key] = input[key];
  });
  ['cnFont', 'viFont'].forEach((key) => {
    // Chỉ là tên font (danh sách chọn sẵn ở frontend) - chặn ký tự có thể phá CSS.
    if (typeof input[key] === 'string' && /^[\w\s-]{2,60}$/.test(input[key])) out[key] = input[key].trim();
  });
  return out;
}

// Công khai: trang chủ/đăng nhập cũng dùng chung kiểu chữ.
router.get('/typography', asyncHandler(async (req, res) => {
  const doc = await db.find('settings', 'typography');
  res.json({ ...TYPOGRAPHY_DEFAULTS, ...((doc && doc.value) || {}) });
}));

router.put('/typography', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const value = { ...TYPOGRAPHY_DEFAULTS, ...sanitize(req.body || {}) };
  const existing = await db.find('settings', 'typography');
  if (existing) await db.update('settings', 'typography', { value });
  else await db.insert('settings', { id: 'typography', value });
  await db.logActivity(req.user.id, 'update_typography', {});
  res.json(value);
}));

module.exports = router;
