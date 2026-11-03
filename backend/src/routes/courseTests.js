const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, optionalAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const { sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Bài kiểm tra dạng file HTML tự chứa, gắn với 1 khoá học (level) thay vì 1 bài học.
 * File lưu cùng chỗ với bài học HTML (storage.*HtmlPage, thư mục theo id bản ghi).
 */
const router = express.Router();
const staffOnly = requireRole('admin', 'teacher');

const isHtmlFile = (file) => ['.html', '.htm'].includes(path.extname(file.originalname || '').toLowerCase());
/** multer đọc tên file theo latin1 -> đổi lại UTF-8 để giữ dấu tiếng Việt / chữ Hán. */
const utf8Name = (file) => Buffer.from(file.originalname, 'latin1').toString('utf8');

/** Học viên chỉ thấy metadata; tên file gốc chỉ dành cho staff. */
function present(test, user) {
  const base = {
    id: test.id, levelId: test.levelId, title: test.title, order: test.order ?? 0,
    published: test.published !== false, version: test.version || 0,
    updatedAt: test.fileUpdatedAt || test.updatedAt || test.createdAt
  };
  if (!access.isStaff(user)) return base;
  return { ...base, originalName: test.originalName || null, size: test.size || 0 };
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.createdAt).localeCompare(String(b.createdAt));
const nextOrder = async (levelId) => (await db.findWhere('courseTests', (t) => t.levelId === levelId)).length + 1;

/** Ghi file HTML mới, xoá phiên bản cũ sau khi lưu thành công. */
async function storeFile(test, file) {
  const { key } = await storage.saveHtmlPage(test.id, file.path, file.originalname);
  const updated = await db.update('courseTests', test.id, {
    fileKey: key, originalName: file.originalname, size: file.size,
    version: (test.version || 0) + 1, fileUpdatedAt: new Date().toISOString()
  });
  if (test.fileKey) await storage.deleteHtmlPage(test.id, test.fileKey).catch((e) => console.error('Xoá file bài kiểm tra cũ lỗi:', e.message));
  return updated;
}

// ---------- Mã code làm bài kiểm tra ----------
// Mỗi mã gắn với 1 khoá: học sinh nhập đúng mã thì mở được mọi bài kiểm tra của khoá đó.
// Mở khoá trả về 1 token (lưu ở trình duyệt học sinh); token chỉ còn hiệu lực khi mã còn bật.
const UNLOCK_TTL = '30d';
const normalizeCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '');
const presentCode = (c) => ({
  id: c.id, code: c.code, levelId: c.levelId, note: c.note || '', active: c.active !== false,
  uses: c.uses || 0, createdAt: c.createdAt
});

router.get('/codes', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const items = await db.all('testCodes');
  res.json(items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(presentCode));
}));

router.post('/codes', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const code = normalizeCode(req.body.code);
  if (!/^[A-Z0-9_-]{4,32}$/.test(code)) return res.status(400).json({ error: 'Mã code gồm 4-32 ký tự chữ, số, gạch ngang (không dấu, không khoảng trắng).' });
  if (!req.body.levelId || !(await db.find('levels', req.body.levelId))) return res.status(400).json({ error: 'Vui lòng chọn khoá học' });
  if ((await db.findWhere('testCodes', (c) => c.code === code)).length) return res.status(400).json({ error: `Mã "${code}" đã tồn tại` });
  const item = await db.insert('testCodes', {
    code, levelId: req.body.levelId, note: String(req.body.note || '').trim().slice(0, 200), active: true, uses: 0
  });
  res.status(201).json(presentCode(item));
}));

router.put('/codes/:id', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const item = await db.find('testCodes', req.params.id);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy mã' });
  const patch = {};
  if (typeof req.body.active === 'boolean') patch.active = req.body.active;
  if (typeof req.body.note === 'string') patch.note = req.body.note.trim().slice(0, 200);
  res.json(presentCode(await db.update('testCodes', item.id, patch)));
}));

router.delete('/codes/:id', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  if (!(await db.remove('testCodes', req.params.id))) return res.status(404).json({ error: 'Không tìm thấy mã' });
  res.json({ success: true });
}));

const unlockLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: 'Bạn nhập sai quá nhiều lần, vui lòng thử lại sau ít phút.' } });

// Học sinh nhập mã. levelId (không bắt buộc) = khoá đang mở: mã của khoá khác thì báo sai khoá.
router.post('/unlock', unlockLimit, asyncHandler(async (req, res) => {
  const code = normalizeCode(req.body.code);
  const item = code && (await db.findWhere('testCodes', (c) => c.code === code))[0];
  if (!item || item.active === false) return res.status(400).json({ error: 'Mã code không đúng hoặc đã hết hiệu lực' });
  const level = await db.find('levels', item.levelId);
  if (!level) return res.status(400).json({ error: 'Mã code không đúng hoặc đã hết hiệu lực' });
  if (req.body.levelId && req.body.levelId !== item.levelId) {
    return res.status(400).json({ error: `Mã này dùng cho khoá "${level.name}", không phải khoá đang mở` });
  }
  await db.update('testCodes', item.id, { uses: (item.uses || 0) + 1, lastUsedAt: new Date().toISOString() });
  const unlockToken = jwt.sign({ testUnlock: true, codeId: item.id, levelId: item.levelId }, JWT_SECRET, { expiresIn: UNLOCK_TTL });
  res.json({ unlockToken, levelId: item.levelId, courseName: level.name });
}));

/** Header X-Test-Unlock hợp lệ cho khoá levelId (mã còn tồn tại và đang bật). */
async function hasUnlock(req, levelId) {
  let payload;
  try {
    payload = jwt.verify(String(req.get('x-test-unlock') || ''), JWT_SECRET);
  } catch (e) {
    return false;
  }
  if (!payload.testUnlock || payload.levelId !== levelId) return false;
  const item = await db.find('testCodes', payload.codeId);
  return !!item && item.active !== false && item.levelId === levelId;
}

// ?levelId= : bài kiểm tra của 1 khoá (học viên chỉ thấy bài đang hiện). Không có levelId: toàn bộ, chỉ staff.
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { levelId } = req.query;
  if (!levelId) {
    if (!access.isStaff(req.user)) return access.deny(res);
    return res.json((await db.all('courseTests')).sort(byOrder).map((t) => present(t, req.user)));
  }
  if (!(await access.canAccessLevel(req.user, String(levelId)))) return access.deny(res, { courseId: levelId });
  let items = await db.findWhere('courseTests', (t) => t.levelId === levelId);
  if (!access.isStaff(req.user)) items = items.filter((t) => t.published !== false && t.fileKey);
  res.json(items.sort(byOrder).map((t) => present(t, req.user)));
}));

// Tạo mới: multipart gồm levelId, title (không bắt buộc) và file .html.
router.post('/', requireAuth, staffOnly, sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  const { levelId, title } = req.body;
  if (!levelId || !(await db.find('levels', levelId))) { cleanup(); return res.status(400).json({ error: 'Vui lòng chọn khoá học' }); }
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file HTML' });
  if (!isHtmlFile(req.file)) { cleanup(); return res.status(400).json({ error: 'Chỉ nhận file .html hoặc .htm' }); }
  try {
    req.file.originalname = utf8Name(req.file);
    const test = await db.insert('courseTests', {
      levelId,
      title: (title || '').trim() || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      order: await nextOrder(levelId), published: req.body.published !== 'false', version: 0
    });
    const updated = await storeFile(test, req.file);
    await db.logActivity(req.user.id, 'upload_course_test', { courseTestId: test.id, levelId, name: req.file.originalname });
    res.status(201).json(present(updated, req.user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải bài kiểm tra lên thất bại' });
  } finally {
    cleanup();
  }
}));

// Thay file HTML (giữ nguyên tiêu đề/khoá học, học viên thấy ngay bản mới).
router.post('/:id/file', requireAuth, staffOnly, sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  const test = await db.find('courseTests', req.params.id);
  if (!test) { cleanup(); return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra' }); }
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file HTML' });
  if (!isHtmlFile(req.file)) { cleanup(); return res.status(400).json({ error: 'Chỉ nhận file .html hoặc .htm' }); }
  try {
    req.file.originalname = utf8Name(req.file);
    const updated = await storeFile(test, req.file);
    await db.logActivity(req.user.id, 'replace_course_test', { courseTestId: test.id, name: req.file.originalname });
    res.json(present(updated, req.user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Thay file thất bại' });
  } finally {
    cleanup();
  }
}));

// Sửa tiêu đề / thứ tự / ẩn-hiện / chuyển sang khoá khác.
router.put('/:id', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const test = await db.find('courseTests', req.params.id);
  if (!test) return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra' });
  const patch = {};
  if (typeof req.body.title === 'string' && req.body.title.trim()) patch.title = req.body.title.trim();
  if (req.body.order !== undefined && req.body.order !== null && req.body.order !== '') patch.order = Number(req.body.order) || 0;
  if (typeof req.body.published === 'boolean') patch.published = req.body.published;
  if (req.body.levelId && req.body.levelId !== test.levelId) {
    if (!(await db.find('levels', req.body.levelId))) return res.status(400).json({ error: 'Khoá học không hợp lệ' });
    patch.levelId = req.body.levelId;
    patch.order = await nextOrder(req.body.levelId);
  }
  res.json(present(await db.update('courseTests', test.id, patch), req.user));
}));

router.delete('/:id', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const test = await db.find('courseTests', req.params.id);
  if (!test) return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra' });
  await storage.deleteHtmlPage(test.id).catch((e) => console.error('Xoá file bài kiểm tra lỗi:', e.message));
  await db.remove('courseTests', test.id);
  await db.logActivity(req.user.id, 'delete_course_test', { courseTestId: test.id, title: test.title });
  res.json({ success: true });
}));

// Token ngắn hạn để nhúng vào iframe (iframe không gửi được header Authorization).
router.get('/:id/token', optionalAuth, asyncHandler(async (req, res) => {
  const test = await db.find('courseTests', req.params.id);
  if (!test || !test.fileKey || (!access.isStaff(req.user) && test.published === false)) {
    return res.status(404).json({ error: 'Bài kiểm tra chưa có nội dung' });
  }
  if (!(await access.canAccessLevel(req.user, test.levelId))) return access.deny(res, { courseId: test.levelId });
  if (!access.isStaff(req.user) && !(await hasUnlock(req, test.levelId))) {
    return res.status(403).json({ error: 'Cần nhập mã code để làm bài kiểm tra', code: 'TEST_CODE_REQUIRED', levelId: test.levelId, title: test.title });
  }
  await access.markLearning(req.user, test.levelId);
  const claims = req.user ? { sub: req.user.id, jti: req.jti } : { guest: true };
  const token = jwt.sign({ ...claims, courseTestId: test.id }, JWT_SECRET, { expiresIn: '5m' });
  res.json({ token, version: test.version, title: test.title, levelId: test.levelId });
}));

router.get('/:id/view', asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.token || ''), JWT_SECRET);
  } catch (e) {
    return res.status(401).send('Liên kết đã hết hạn, vui lòng tải lại trang.');
  }
  if (payload.courseTestId !== req.params.id) return res.status(403).send('Liên kết không hợp lệ.');
  const user = payload.guest ? null : await db.find('users', payload.sub);
  if (!payload.guest && (!user || !(user.activeSessions || []).some((s) => s.jti === payload.jti))) {
    return res.status(401).send('Phiên đăng nhập không còn hiệu lực.');
  }
  const test = await db.find('courseTests', req.params.id);
  if (!test || !test.fileKey) return res.status(404).send('Không tìm thấy bài kiểm tra.');
  // Kiểm tra lại quyền tại thời điểm xem (token có thể còn hạn sau khi quyền bị thu hồi).
  if (!(await access.canAccessLevel(user, test.levelId))) return res.status(403).send('Bạn chưa được cấp quyền truy cập khoá học này.');

  if (user) await db.logActivity(user.id, 'view_course_test', { courseTestId: test.id });
  // File tự chứa cần chạy script nội tuyến của chính nó: cùng cách phục vụ với routes/htmlPages.js.
  const frontend = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  res.removeHeader('X-Frame-Options');
  res.set('Content-Security-Policy', `frame-ancestors 'self' ${frontend.length ? frontend.join(' ') : '*'}`);
  const sent = await storage.sendHtmlPage(res, test.id, test.fileKey);
  if (!sent) res.status(404).send('File không tồn tại.');
}));

module.exports = router;
