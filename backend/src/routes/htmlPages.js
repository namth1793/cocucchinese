const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const { sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const staffOnly = requireRole('admin', 'teacher');

const isHtmlFile = (file) => ['.html', '.htm'].includes(path.extname(file.originalname || '').toLowerCase());

/** Học viên chỉ thấy metadata; tên file gốc/key lưu trữ chỉ dành cho staff. */
function present(page, user) {
  const base = {
    id: page.id, lessonId: page.lessonId, title: page.title, order: page.order ?? 0,
    published: page.published !== false, hasFile: !!page.fileKey, version: page.version || 0,
    updatedAt: page.fileUpdatedAt || page.updatedAt || page.createdAt
  };
  if (!access.isStaff(user)) return base;
  return { ...base, originalName: page.originalName || null, size: page.size || 0 };
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.createdAt).localeCompare(String(b.createdAt));

/** Ghi file HTML mới cho trang, xoá phiên bản cũ sau khi lưu thành công. */
async function storeFile(page, file) {
  const { key } = await storage.saveHtmlPage(page.id, file.path, file.originalname);
  const updated = await db.update('htmlPages', page.id, {
    fileKey: key, originalName: file.originalname, size: file.size,
    version: (page.version || 0) + 1, fileUpdatedAt: new Date().toISOString()
  });
  if (page.fileKey) await storage.deleteHtmlPage(page.id, page.fileKey).catch((e) => console.error('Xoá file HTML cũ lỗi:', e.message));
  return updated;
}

// Danh sách trang HTML của 1 bài học. Học viên: chỉ bài thuộc khoá đã được cấp quyền, chỉ trang đã xuất bản.
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'Thiếu lessonId' });
  if (!(await access.canAccessLesson(req.user, String(lessonId)))) return access.deny(res);
  let items = await db.findWhere('htmlPages', (p) => p.lessonId === lessonId);
  if (!access.isStaff(req.user)) items = items.filter((p) => p.published !== false && p.fileKey);
  res.json(items.sort(byOrder).map((p) => present(p, req.user)));
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const page = await db.find('htmlPages', req.params.id);
  if (!page || (!access.isStaff(req.user) && page.published === false)) return res.status(404).json({ error: 'Không tìm thấy bài học HTML' });
  if (!(await access.canAccessLesson(req.user, page.lessonId))) return access.deny(res);
  res.json(present(page, req.user));
}));

// Tạo mới: multipart gồm lessonId, title, order và file .html (bắt buộc).
router.post('/', requireAuth, staffOnly, sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  const { lessonId, title } = req.body;
  if (!lessonId || !(await db.find('lessons', lessonId))) { cleanup(); return res.status(400).json({ error: 'Bài học không hợp lệ' }); }
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file HTML' });
  if (!isHtmlFile(req.file)) { cleanup(); return res.status(400).json({ error: 'Chỉ nhận file .html hoặc .htm' }); }
  try {
    const siblings = await db.findWhere('htmlPages', (p) => p.lessonId === lessonId);
    const order = req.body.order !== undefined && req.body.order !== '' ? Number(req.body.order) : siblings.length + 1;
    const page = await db.insert('htmlPages', {
      lessonId,
      title: (title || '').trim() || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      order, published: req.body.published !== 'false', version: 0
    });
    const updated = await storeFile(page, req.file);
    await db.logActivity(req.user.id, 'upload_html_page', { htmlPageId: page.id, name: req.file.originalname });
    res.status(201).json(present(updated, req.user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải file HTML lên thất bại' });
  } finally {
    cleanup();
  }
}));

// Thay file HTML (giữ nguyên tiêu đề/thứ tự, học viên thấy ngay bản mới).
router.post('/:id/file', requireAuth, staffOnly, sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  const page = await db.find('htmlPages', req.params.id);
  if (!page) { cleanup(); return res.status(404).json({ error: 'Không tìm thấy bài học HTML' }); }
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file HTML' });
  if (!isHtmlFile(req.file)) { cleanup(); return res.status(400).json({ error: 'Chỉ nhận file .html hoặc .htm' }); }
  try {
    const updated = await storeFile(page, req.file);
    await db.logActivity(req.user.id, 'replace_html_page', { htmlPageId: page.id, name: req.file.originalname });
    res.json(present(updated, req.user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Thay file HTML thất bại' });
  } finally {
    cleanup();
  }
}));

// Sửa tiêu đề / thứ tự / ẩn-hiện.
router.put('/:id', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const page = await db.find('htmlPages', req.params.id);
  if (!page) return res.status(404).json({ error: 'Không tìm thấy bài học HTML' });
  const patch = {};
  if (typeof req.body.title === 'string' && req.body.title.trim()) patch.title = req.body.title.trim();
  if (req.body.order !== undefined && req.body.order !== null && req.body.order !== '') patch.order = Number(req.body.order) || 0;
  if (typeof req.body.published === 'boolean') patch.published = req.body.published;
  res.json(present(await db.update('htmlPages', page.id, patch), req.user));
}));

router.delete('/:id', requireAuth, staffOnly, asyncHandler(async (req, res) => {
  const page = await db.find('htmlPages', req.params.id);
  if (!page) return res.status(404).json({ error: 'Không tìm thấy bài học HTML' });
  await storage.deleteHtmlPage(page.id).catch((e) => console.error('Xoá thư mục HTML lỗi:', e.message));
  await db.remove('htmlPages', page.id);
  await db.logActivity(req.user.id, 'delete_html_page', { htmlPageId: page.id, title: page.title });
  res.json({ success: true });
}));

// Token ngắn hạn để nhúng trang vào iframe (iframe không gửi được header Authorization).
router.get('/:id/token', requireAuth, asyncHandler(async (req, res) => {
  const page = await db.find('htmlPages', req.params.id);
  if (!page || !page.fileKey || (!access.isStaff(req.user) && page.published === false)) {
    return res.status(404).json({ error: 'Bài học chưa có nội dung' });
  }
  if (!(await access.canAccessLesson(req.user, page.lessonId))) return access.deny(res);
  await access.markLessonLearning(req.user, page.lessonId);
  const token = jwt.sign({ sub: req.user.id, htmlPageId: page.id, jti: req.jti }, JWT_SECRET, { expiresIn: '5m' });
  res.json({ token, version: page.version });
}));

router.get('/:id/view', asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.token || ''), JWT_SECRET);
  } catch (e) {
    return res.status(401).send('Liên kết đã hết hạn, vui lòng tải lại trang.');
  }
  if (payload.htmlPageId !== req.params.id) return res.status(403).send('Liên kết không hợp lệ.');
  const user = await db.find('users', payload.sub);
  if (!user || !(user.activeSessions || []).some((s) => s.jti === payload.jti)) return res.status(401).send('Phiên đăng nhập không còn hiệu lực.');
  const page = await db.find('htmlPages', req.params.id);
  if (!page || !page.fileKey) return res.status(404).send('Không tìm thấy bài học.');
  // Kiểm tra lại quyền tại thời điểm xem (token có thể còn hạn sau khi quyền bị thu hồi).
  if (!(await access.canAccessLesson(user, page.lessonId))) return res.status(403).send('Bạn chưa được cấp quyền truy cập khoá học này.');

  await db.logActivity(user.id, 'view_html_page', { htmlPageId: page.id });
  // File HTML tự chứa cần chạy script/style nội tuyến của chính nó: bỏ CSP mặc định của helmet,
  // chỉ giới hạn trang nào được nhúng nó vào iframe.
  const frontend = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  res.removeHeader('X-Frame-Options');
  res.set('Content-Security-Policy', `frame-ancestors 'self' ${frontend.length ? frontend.join(' ') : '*'}`);
  const sent = await storage.sendHtmlPage(res, page.id, page.fileKey);
  if (!sent) res.status(404).send('File không tồn tại.');
}));

module.exports = router;
