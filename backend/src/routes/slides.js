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

/**
 * Hỏi lại CloudConvert cho tới khi job xong, tự lặp lại (poll) thay vì dùng
 * endpoint /wait có sẵn của CloudConvert - endpoint đó tự bỏ cuộc sau một
 * khoảng thời gian cố định nếu job chưa xong, không phù hợp với PPT nhiều
 * trang (vài trăm trang có thể mất nhiều phút để LibreOffice render xong).
 */
async function waitForCloudConvertJob(jobId, { intervalMs = 5000, maxWaitMs = 30 * 60 * 1000 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const { data } = await cloudconvert.get(`/jobs/${jobId}`);
    const job = data.data;
    const failedTask = job.tasks.find((t) => t.status === 'error');
    if (failedTask) throw new Error(failedTask.message || 'CloudConvert không hoàn tất được việc chuyển đổi');
    if (job.status === 'finished') return job;
    if (job.status === 'error') throw new Error('CloudConvert không hoàn tất được việc chuyển đổi');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Quá thời gian chờ chuyển đổi (trên 30 phút) - file có thể quá nhiều trang');
}

// Danh sách bài giảng của 1 bài học - CHỈ trả về metadata, không lộ đường dẫn file gốc.
// sourceFileName/sourceOriginalName/convertStatus cũng chỉ hiển thị cho giáo viên/admin (route staff).
router.get('/', requireAuth, (req, res) => {
  let items = db.all('slides');
  if (req.query.lessonId) items = items.filter((s) => s.lessonId === req.query.lessonId);
  const isStaff = req.user.role === 'admin' || req.user.role === 'teacher';
  res.json(items.map((s) => ({
    id: s.id, lessonId: s.lessonId, title: s.title, pageCount: s.pages.length, version: s.version,
    ...(isStaff ? { sourceOriginalName: s.sourceOriginalName || null, convertStatus: s.convertStatus || null } : {})
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

/**
 * Chạy toàn bộ quá trình convert ở nền (không gắn với request/response của
 * client) - PPT nhiều trang (vài trăm trang) có thể mất nhiều phút để
 * LibreOffice render xong bên CloudConvert, lâu hơn thời gian một proxy/tầng
 * trung gian (Railway...) chịu giữ mở 1 kết nối HTTP đang chờ. Tiến độ được
 * lưu vào slide.convertStatus, client tự polling qua GET /:id/convert-status.
 */
async function runConvertPptxInBackground(slideId, file, userId) {
  try {
    // Engine 'office' (LibreOffice) chỉ dùng cho file Office (ppt/pptx/doc...).
    // Với PDF, không ép engine mà khai báo rõ input_format: 'pdf' để
    // CloudConvert tự chọn bộ chuyển đổi phù hợp - thiếu input_format khiến
    // CloudConvert báo "This conversion type is not supported" cho PDF.
    const isPdf = path.extname(file.originalname || '').toLowerCase() === '.pdf';
    const { data: job } = await cloudconvert.post('/jobs', {
      tasks: {
        'upload-file': { operation: 'import/upload' },
        'convert-file': {
          operation: 'convert',
          input: 'upload-file',
          output_format: 'png',
          ...(isPdf ? { input_format: 'pdf' } : { engine: 'office' })
        },
        'export-file': { operation: 'export/url', input: 'convert-file' }
      }
    });

    const uploadTask = job.data.tasks.find((t) => t.name === 'upload-file');
    const form = uploadTask.result.form;
    const uploadForm = new FormData();
    Object.entries(form.parameters).forEach(([key, value]) => uploadForm.append(key, value));
    uploadForm.append('file', fs.createReadStream(file.path), { filename: file.originalname, knownLength: file.size });
    await axios.post(form.url, uploadForm, { headers: uploadForm.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity });

    const finishedJob = await waitForCloudConvertJob(job.data.id);

    const exportTask = finishedJob.tasks.find((t) => t.name === 'export-file');
    const files = (exportTask.result?.files || []).slice()
      .sort((a, b) => pageNumberFromFilename(a.filename) - pageNumberFromFilename(b.filename));
    if (files.length === 0) throw new Error('Không nhận được trang nào từ CloudConvert');

    const uploaded = [];
    for (const f of files) {
      const { data: buf } = await axios.get(f.url, { responseType: 'arraybuffer' });
      uploaded.push(await storage.saveSlidePage(slideId, Buffer.from(buf), f.filename, 'image/png'));
    }

    const current = db.find('slides', slideId);
    const newPages = uploaded.map(({ key }, i) => ({ pageNum: current.pages.length + i + 1, fileName: key }));
    const pages = [...current.pages, ...newPages];
    db.update('slides', slideId, { pages, version: (current.version || 1) + 1 });

    await storage.saveSlideSource(slideId, file.path, file.originalname, file.mimetype);
    db.update('slides', slideId, { sourceOriginalName: file.originalname, convertStatus: { state: 'done' } });

    db.logActivity(userId, 'convert_pptx', { slideId, pages: newPages.length, name: file.originalname });
  } catch (e) {
    console.error('convert-pptx failed:', e?.response?.data || e.message || e);
    db.update('slides', slideId, {
      convertStatus: { state: 'error', error: 'Chuyển đổi PPT thất bại: ' + (e.message || 'lỗi không xác định') }
    });
  } finally {
    fs.unlink(file.path, () => {});
  }
}

// Tải file PPT/PDF lên và TỰ ĐỘNG convert thành ảnh từng trang qua CloudConvert
// (thay cho việc giáo viên phải tự xuất ảnh rồi tải lên thủ công ở route
// /:id/pages). File gốc cũng được lưu lại như route /:id/source ở trên.
// Convert chạy nền (xem runConvertPptxInBackground) - route trả lời ngay,
// client tự polling GET /:id/convert-status để biết khi nào xong.
router.post('/:id/convert-pptx', requireAuth, requireRole('admin', 'teacher'), sourceFileUpload.single('file'), (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy bài giảng' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  if (!CLOUDCONVERT_API_KEY) {
    fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Chưa cấu hình CLOUDCONVERT_API_KEY trên server. Vui lòng tải ảnh từng trang thủ công, hoặc liên hệ quản trị hệ thống.' });
  }

  db.update('slides', slide.id, { convertStatus: { state: 'processing' } });
  res.status(202).json({ status: 'processing' });
  runConvertPptxInBackground(slide.id, req.file, req.user.id);
});

// Tiến độ convert PPT (client polling định kỳ trong lúc chờ) - chỉ giáo viên/admin.
router.get('/:id/convert-status', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const slide = db.find('slides', req.params.id);
  if (!slide) return res.status(404).json({ error: 'Không tìm thấy bài giảng' });
  res.json({ convertStatus: slide.convertStatus || { state: 'idle' }, pageCount: slide.pages.length, version: slide.version });
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
