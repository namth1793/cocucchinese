const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Ứng dụng quản lý lớp & điểm danh: 1 file HTML tự chứa (backend/classroom/index.html), dữ liệu
 * nằm trên Firebase của chính nó. Backend chỉ phục vụ file cho staff, qua token như bài học HTML.
 */
const router = express.Router();
const APP_FILE = path.join(__dirname, '..', '..', 'classroom', 'index.html');

router.get('/token', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  res.json({ token: jwt.sign({ sub: req.user.id, jti: req.jti, classroom: true }, JWT_SECRET, { expiresIn: '5m' }) });
});

router.get('/view', asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.token || ''), JWT_SECRET);
  } catch (e) {
    return res.status(401).send('Liên kết đã hết hạn, vui lòng tải lại trang.');
  }
  if (!payload.classroom) return res.status(403).send('Liên kết không hợp lệ.');
  const user = await db.find('users', payload.sub);
  if (!user || !(user.activeSessions || []).some((s) => s.jti === payload.jti)) {
    return res.status(401).send('Phiên đăng nhập không còn hiệu lực.');
  }
  if (user.role !== 'admin' && user.role !== 'teacher') return res.status(403).send('Bạn không có quyền xem trang này.');

  // Ứng dụng cần script CDN/Firebase của nó: bỏ CSP mặc định, chỉ giới hạn trang được nhúng.
  const frontend = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  res.removeHeader('X-Frame-Options');
  res.set('Content-Security-Policy', `frame-ancestors 'self' ${frontend.length ? frontend.join(' ') : '*'}`);
  res.sendFile(APP_FILE);
}));

module.exports = router;
