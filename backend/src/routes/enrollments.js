const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const access = require('../utils/access');
const svc = require('../services/enrollmentService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const { ENROLLMENT_STATUS } = access;

router.use(requireAuth, requireRole('admin'));

async function view(e) {
  const [user, level] = await Promise.all([db.find('users', e.userId), db.find('levels', e.levelId)]);
  return {
    ...e,
    name: user ? user.name : '',
    userStatus: user ? user.status : null,
    courseName: level ? level.name : '(đã xoá)',
    progressPercent: level ? await access.courseProgressPercent(e.userId, e.levelId) : 0
  };
}

router.get('/', asyncHandler(async (req, res) => {
  let items = await db.all('enrollments');
  if (req.query.levelId) items = items.filter((e) => e.levelId === req.query.levelId);
  if (req.query.status) items = items.filter((e) => e.status === req.query.status);
  res.json(await Promise.all([...items].reverse().map(view)));
}));

// Cấp quyền thủ công cho 1 email (thanh toán ngoài hệ thống, tặng khoá...).
router.post('/', asyncHandler(async (req, res) => {
  const { levelId, name, note } = req.body || {};
  const email = access.normalizeEmail(req.body && req.body.email);
  if (!email || !levelId) return res.status(400).json({ error: 'Thiếu email hoặc khoá học' });
  if (!(await db.find('levels', levelId))) return res.status(404).json({ error: 'Không tìm thấy khoá học' });
  const existing = await svc.findUserByEmail(email);
  if (existing && existing.role !== 'student') return res.status(400).json({ error: 'Email này thuộc tài khoản giáo viên/quản trị' });
  const { user, created, tempPassword } = await svc.ensureStudent({ name, email });
  const enrollment = await svc.grantEnrollment({ user, levelId, grantedBy: req.user.id, note: note || 'Cấp thủ công' });
  await db.logActivity(req.user.id, 'enrollment_grant', { email, levelId });
  res.status(201).json({ enrollment: await view(enrollment), accountCreated: created, tempPassword });
}));

// Đổi trạng thái: đã mua -> đang học -> hoàn thành; hoặc thu hồi quyền.
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!Object.values(ENROLLMENT_STATUS).includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  const enr = await db.find('enrollments', req.params.id);
  if (!enr) return res.status(404).json({ error: 'Không tìm thấy' });
  const now = new Date().toISOString();
  const patch = { status };
  if (status === ENROLLMENT_STATUS.LEARNING && !enr.startedAt) patch.startedAt = now;
  if (status === ENROLLMENT_STATUS.COMPLETED) patch.completedAt = now;
  if (status === ENROLLMENT_STATUS.REVOKED) {
    patch.revokedAt = now;
    // Thu hồi khoá cuối cùng -> đăng xuất mọi thiết bị luôn.
    const stillActive = await db.findWhere('enrollments', (e) => e.userId === enr.userId && e.id !== enr.id && access.ACTIVE_STATUSES.includes(e.status));
    if (stillActive.length === 0) await db.update('users', enr.userId, { activeSessions: [] });
  } else {
    patch.revokedAt = null;
  }
  const updated = await db.update('enrollments', enr.id, patch);
  await db.logActivity(req.user.id, 'enrollment_status', { enrollmentId: enr.id, status });
  res.json(await view(updated));
}));

module.exports = router;
