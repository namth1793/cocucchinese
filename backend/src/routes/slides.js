const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const { slideUpload, sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');

const router = express.Router();

// Danh sách bài giảng của 1 bài học - CHỈ trả về metadata, không lộ đường dẫn file gốc.
// sourceFileName/sourceOriginalName cũng chỉ hiển thị cho giáo viên/admin (route staff).
router.get('/', requireAuth, (req, res) => {
  let items = db.all('slides');
  if (req.query.lessonId) items = items.filter((s) => s.lessonId === req.query.lessonId);
  const isStaff = req.user.role === 'admin' || req.user.role === 'teacher';
  res.json(items.map((s) => ({
    id: s.id, lessonId: s.lessonId, title: s.title, pageCount: s.pages.length, version: s.version,
    ...(isStaff ? { sourceOriginalName: s.sourceOriginalName || null } : {})
  })));
});

router.post('/', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const { lessonId, title } = req.body;
  if (!lessonId || !title) return res.status(400).json({ error: 'Thiếu lessonId hoặc title' });
  res.status(201).json(db.insert('slides', { lessonId, title, pages: [], version: 1 }));
});

router.post('/:id/pages', requireAuth, requireRole('admin', 'teacher'), slideUpload.array('pages', 80), async (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy bài giảng' });
  try {
    const uploaded = await Promise.all(
      (req.files || []).map((f) => storage.saveSlidePage(slide.id, f.buffer, f.originalname, f.mimetype))
    );
    const newPages = uploaded.map(({ key }, i) => ({ pageNum: slide.pages.length + i + 1, fileName: key }));
    const pages = [...slide.pages, ...newPages];
    const updated = db.update('slides', slide.id, { pages, version: (slide.version || 1) + 1 });
    db.logActivity(req.user.id, 'upload_slide_pages', { slideId: slide.id, count: newPages.length });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải trang bài giảng lên thất bại' });
  }
});

// Tải lên file PowerPoint/tài liệu gốc - chỉ giáo viên/admin, không convert,
// không hiển thị/chia sẻ cho học sinh. Học sinh vẫn xem bài giảng qua các
// trang ảnh (route /:id/pages ở trên) như bình thường.
router.post('/:id/source', requireAuth, requireRole('admin', 'teacher'), sourceFileUpload.single('file'), async (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy bài giảng' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  try {
    await storage.saveSlideSource(slide.id, req.file.buffer, req.file.originalname, req.file.mimetype);
    const updated = db.update('slides', slide.id, { sourceOriginalName: req.file.originalname });
    db.logActivity(req.user.id, 'upload_slide_source', { slideId: slide.id, name: req.file.originalname });
    res.json({ sourceOriginalName: updated.sourceOriginalName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải file PowerPoint lên thất bại' });
  }
});

// Tải file PowerPoint/tài liệu gốc về - chỉ giáo viên/admin.
router.get('/:id/source', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide || !slide.sourceOriginalName) return res.status(404).json({ error: 'Chưa có file gốc' });
  const ext = path.extname(slide.sourceOriginalName) || '';
  try {
    const sent = await storage.sendSlideSource(res, slide.id, `source${ext}`, slide.sourceOriginalName);
    if (!sent) res.status(404).json({ error: 'File không tồn tại' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Không tải được file' });
  }
});

// Cấp token ngắn hạn (5 phút), chỉ dùng được với tài khoản/phiên đăng nhập hiện tại
router.get('/:id/token', requireAuth, (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy' });
  const token = jwt.sign({ sub: req.user.id, slideId: slide.id, jti: req.jti }, JWT_SECRET, { expiresIn: '5m' });
  res.json({ token, expiresIn: 300, pageCount: slide.pages.length, title: slide.title });
});

// Xem từng trang qua stream có kiểm soát (local) hoặc URL ký ngắn hạn (R2) -
// không dùng static route công khai, không cho tải xuống trực tiếp.
router.get('/:id/page/:n', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'Thiếu token truy cập' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' });
  }
  if (payload.slideId !== req.params.id) return res.status(403).json({ error: 'Token không khớp tài liệu' });
  const user = db.find('users', payload.sub);
  const session = user && (user.activeSessions || []).find((s) => s.jti === payload.jti);
  if (!user || !session) return res.status(401).json({ error: 'Phiên đăng nhập không còn hiệu lực' });

  const slide = db.find('slides', req.params.id);
  const page = slide && slide.pages.find((p) => p.pageNum === parseInt(req.params.n, 10));
  if (!page) return res.status(404).json({ error: 'Không tìm thấy trang' });

  db.logActivity(user.id, 'view_slide', { slideId: slide.id, page: page.pageNum });

  try {
    const sent = await storage.sendSlidePage(res, slide.id, page.fileName);
    if (!sent) res.status(404).json({ error: 'File không tồn tại' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Không tải được trang bài giảng' });
  }
});

router.post('/:id/progress', requireAuth, (req, res) => {
  const { page, percent } = req.body;
  res.json(db.upsertSlideProgress(req.user.id, req.params.id, page, percent));
});

router.get('/:id/my-progress', requireAuth, (req, res) => {
  const doc = db.findWhere('slideProgress', (d) => d.userId === req.user.id && d.slideId === req.params.id)[0];
  res.json(doc || { lastPage: 0, percent: 0 });
});

module.exports = router;
