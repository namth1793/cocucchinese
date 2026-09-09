const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const { slideUpload, sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');

const router = express.Router();

const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY;
const cloudconvert = axios.create({
  baseURL: 'https://api.cloudconvert.com/v2',
  headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` }
});

/** Số trang trong tên file CloudConvert trả về (VD: "bai-1-2.png" -> 2), dùng để sắp đúng thứ tự. */
function pageNumberFromFilename(filename) {
  const match = filename.match(/(\d+)(?=\.\w+$)/);
  return match ? parseInt(match[1], 10) : 0;
}

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
    await storage.saveSlideSource(slide.id, req.file.path, req.file.originalname, req.file.mimetype);
    const updated = db.update('slides', slide.id, { sourceOriginalName: req.file.originalname });
    db.logActivity(req.user.id, 'upload_slide_source', { slideId: slide.id, name: req.file.originalname });
    res.json({ sourceOriginalName: updated.sourceOriginalName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải file PowerPoint lên thất bại' });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

// Tải file PPT/PDF lên và TỰ ĐỘNG convert thành ảnh từng trang qua CloudConvert
// (thay cho việc giáo viên phải tự xuất ảnh rồi tải lên thủ công ở route
// /:id/pages). File gốc cũng được lưu lại như route /:id/source ở trên.
router.post('/:id/convert-pptx', requireAuth, requireRole('admin', 'teacher'), sourceFileUpload.single('file'), async (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy bài giảng' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  if (!CLOUDCONVERT_API_KEY) {
    fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Chưa cấu hình CLOUDCONVERT_API_KEY trên server. Vui lòng tải ảnh từng trang thủ công, hoặc liên hệ quản trị hệ thống.' });
  }

  try {
    const { data: job } = await cloudconvert.post('/jobs', {
      tasks: {
        'upload-file': { operation: 'import/upload' },
        'convert-file': { operation: 'convert', input: 'upload-file', output_format: 'png', engine: 'office' },
        'export-file': { operation: 'export/url', input: 'convert-file' }
      }
    });

    const uploadTask = job.data.tasks.find((t) => t.name === 'upload-file');
    const form = uploadTask.result.form;
    const uploadForm = new FormData();
    Object.entries(form.parameters).forEach(([key, value]) => uploadForm.append(key, value));
    uploadForm.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, knownLength: req.file.size });
    await axios.post(form.url, uploadForm, { headers: uploadForm.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity });

    const { data: waited } = await cloudconvert.get(`/jobs/${job.data.id}/wait`);
    const finishedJob = waited.data;
    const failedTask = finishedJob.tasks.find((t) => t.status === 'error');
    if (finishedJob.status !== 'finished' || failedTask) {
      throw new Error(failedTask?.message || 'CloudConvert không hoàn tất được việc chuyển đổi');
    }

    const exportTask = finishedJob.tasks.find((t) => t.name === 'export-file');
    const files = (exportTask.result?.files || []).slice()
      .sort((a, b) => pageNumberFromFilename(a.filename) - pageNumberFromFilename(b.filename));
    if (files.length === 0) throw new Error('Không nhận được trang nào từ CloudConvert');

    const uploaded = [];
    for (const f of files) {
      const { data: buf } = await axios.get(f.url, { responseType: 'arraybuffer' });
      uploaded.push(await storage.saveSlidePage(slide.id, Buffer.from(buf), f.filename, 'image/png'));
    }

    const newPages = uploaded.map(({ key }, i) => ({ pageNum: slide.pages.length + i + 1, fileName: key }));
    const pages = [...slide.pages, ...newPages];
    db.update('slides', slide.id, { pages, version: (slide.version || 1) + 1 });

    await storage.saveSlideSource(slide.id, req.file.path, req.file.originalname, req.file.mimetype);
    const updated = db.update('slides', slide.id, { sourceOriginalName: req.file.originalname });

    db.logActivity(req.user.id, 'convert_pptx', { slideId: slide.id, pages: newPages.length, name: req.file.originalname });
    res.json(updated);
  } catch (e) {
    console.error('convert-pptx failed:', e?.response?.data || e.message || e);
    res.status(500).json({ error: 'Chuyển đổi PPT thất bại: ' + (e.message || 'lỗi không xác định') });
  } finally {
    fs.unlink(req.file.path, () => {});
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

// Xoá cả bộ bài giảng (trang ảnh + file gốc) - dùng khi cần tải lại từ đầu.
router.delete('/:id', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy bài giảng' });
  try {
    await storage.deleteSlideDeck(slide.id);
    db.remove('slides', slide.id);
    db.logActivity(req.user.id, 'delete_slide_deck', { slideId: slide.id, title: slide.title });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Xoá bộ bài giảng thất bại' });
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
