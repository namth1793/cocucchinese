const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const access = require('../utils/access');
const svc = require('../services/enrollmentService');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function paymentInfo(order) {
  return {
    bankName: process.env.BANK_NAME || '',
    accountNumber: process.env.BANK_ACCOUNT || '',
    accountName: process.env.BANK_ACCOUNT_NAME || '',
    transferContent: order.code,
    note: process.env.PAYMENT_NOTE || ''
  };
}

/** Bản trả về cho người mua (không có password hash / dữ liệu nội bộ). */
function publicOrder(order) {
  const level = db.find('levels', order.levelId);
  return {
    code: order.code, status: order.status, amount: order.amount,
    courseName: level ? level.name : '', name: order.name, email: order.email,
    createdAt: order.createdAt,
    payment: paymentInfo(order)
  };
}

function newOrderCode() {
  for (;;) {
    const code = 'HSK' + crypto.randomBytes(3).toString('hex').toUpperCase();
    if (!db.findWhere('orders', (o) => o.code === code)[0]) return code;
  }
}

// --- Công khai: học viên đăng ký mua khoá ---------------------------------
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { error: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau.' }
});

router.post('/', createLimiter, (req, res) => {
  const { levelId, name, phone, note, password } = req.body || {};
  const email = access.normalizeEmail(req.body && req.body.email);
  if (!name || !String(name).trim() || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Vui lòng nhập họ tên và email hợp lệ' });
  }
  const level = db.find('levels', levelId);
  if (!level || typeof level.price !== 'number' || level.listed === false) {
    return res.status(404).json({ error: 'Khoá học không tồn tại hoặc chưa mở đăng ký' });
  }
  const existingUser = svc.findUserByEmail(email);
  if (!existingUser && (!password || String(password).length < 6)) {
    return res.status(400).json({ error: 'Vui lòng đặt mật khẩu tối thiểu 6 ký tự để đăng nhập sau khi thanh toán' });
  }
  if (existingUser) {
    const has = db.findWhere('enrollments', (e) => e.userId === existingUser.id && e.levelId === level.id && access.ACTIVE_STATUSES.includes(e.status))[0];
    if (has) return res.status(409).json({ error: 'Email này đã có quyền truy cập khoá học này. Hãy đăng nhập để học.' });
  }

  // Cùng email + cùng khoá đang chờ thanh toán -> dùng lại đơn cũ, tránh tạo trùng.
  const pending = db.findWhere('orders', (o) => o.email === email && o.levelId === level.id && o.status === 'pending')[0];
  if (pending) return res.status(200).json(publicOrder(pending));

  const order = db.insert('orders', {
    code: newOrderCode(),
    levelId: level.id, amount: level.price,
    name: String(name).trim(), email, phone: String(phone || '').trim(), note: String(note || '').slice(0, 500),
    // Mật khẩu chỉ dùng khi email chưa có tài khoản; chỉ lưu dạng băm.
    passwordHash: !existingUser && password ? bcrypt.hashSync(String(password), 10) : null,
    status: 'pending'
  });
  res.status(201).json(publicOrder(order));
});

// Tra cứu trạng thái đơn bằng mã đơn (mã ngẫu nhiên, đồng thời là nội dung chuyển khoản).
router.get('/lookup/:code', (req, res) => {
  const order = db.findWhere('orders', (o) => o.code === String(req.params.code).toUpperCase())[0];
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn đăng ký' });
  res.json(publicOrder(order));
});

// --- Admin: xác nhận thanh toán / từ chối ---------------------------------
function adminView(order) {
  const level = db.find('levels', order.levelId);
  const { passwordHash, ...rest } = order;
  return { ...rest, courseName: level ? level.name : '(đã xoá)', hasChosenPassword: !!passwordHash };
}

router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  let items = db.all('orders');
  if (req.query.status) items = items.filter((o) => o.status === req.query.status);
  res.json([...items].reverse().map(adminView));
});

router.post('/:id/confirm', requireAuth, requireRole('admin'), (req, res) => {
  const order = db.find('orders', req.params.id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn' });
  if (order.status === 'paid') return res.status(409).json({ error: 'Đơn này đã được xác nhận trước đó' });
  if (!db.find('levels', order.levelId)) return res.status(400).json({ error: 'Khoá học của đơn này không còn tồn tại' });

  const existing = svc.findUserByEmail(order.email);
  if (existing && existing.role !== 'student') {
    return res.status(400).json({ error: 'Email này thuộc tài khoản giáo viên/quản trị, không thể cấp quyền học viên' });
  }
  const { user, created, tempPassword } = svc.ensureStudent({ name: order.name, email: order.email, passwordHash: order.passwordHash });
  const enrollment = svc.grantEnrollment({ user, levelId: order.levelId, orderId: order.id, grantedBy: req.user.id });
  const updated = db.update('orders', order.id, {
    status: 'paid', paidAt: new Date().toISOString(), confirmedBy: req.user.id, userId: user.id,
    passwordHash: null // đã chuyển sang tài khoản, không giữ lại
  });
  db.logActivity(req.user.id, 'order_confirm', { orderId: order.id, email: order.email, levelId: order.levelId });
  res.json({ order: adminView(updated), enrollment, accountCreated: created, tempPassword });
});

router.post('/:id/reject', requireAuth, requireRole('admin'), (req, res) => {
  const order = db.find('orders', req.params.id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn' });
  if (order.status === 'paid') return res.status(409).json({ error: 'Đơn đã thanh toán, hãy thu hồi quyền ở mục Học viên' });
  const updated = db.update('orders', order.id, { status: 'rejected', passwordHash: null, adminNote: String((req.body && req.body.note) || '') });
  res.json(adminView(updated));
});

module.exports = router;
