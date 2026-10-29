const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sourceFileUpload, mediaUpload } = require('../middleware/upload');
const storage = require('../storage');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Kho tài liệu: nơi admin/giáo viên cất file sách (giáo trình, sách bài tập, đề...) dùng chung,
// không gắn với bài học nào. Sách được đánh dấu showOnHome hiện công khai ở mục "Kho tài liệu"
// trên trang chủ (ảnh bìa + giới thiệu + link tải); sách còn lại chỉ nhân sự xem được.
// Sách tải lên trước khi có tính năng này không có showOnHome -> mặc định vẫn nội bộ.
const MAX_MB = 500;
const EXTS = ['.pdf', '.epub', '.mobi', '.azw3', '.djvu', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar', '.7z', '.mp3', '.m4a', '.wav', '.mp4'];
const staff = [requireAuth, requireRole('admin', 'teacher')];

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
/** Link tải ngoài (Google Drive...) - chỉ nhận http(s), chặn javascript:... */
const cleanUrl = (v) => {
  const url = clean(v, 1000);
  return /^https?:\/\/\S+$/i.test(url) ? url : '';
};
const bool = (v) => v === true || v === 'true' || v === '1' || v === 'on';
function fields(body) {
  return {
    title: clean(body.title, 200),
    author: clean(body.author, 160),
    category: clean(body.category, 80),
    note: clean(body.note, 1000),
    description: clean(body.description, 4000),
    downloadUrl: cleanUrl(body.downloadUrl),
    showOnHome: bool(body.showOnHome)
  };
}

const isPublic = (book) => book.showOnHome === true && (book.fileUrl || book.downloadUrl);

/** Thông tin công khai - không lộ fileUrl gốc / người tải lên; tải qua /:id/download. */
const publicBook = (b) => ({
  id: b.id, title: b.title, author: b.author || '', category: b.category || '',
  description: b.description || '', coverUrl: b.coverUrl || null,
  fileType: b.fileUrl ? path.extname(b.originalName || '').slice(1).toUpperCase() : '',
  size: b.fileUrl ? b.size || 0 : 0,
  external: !b.fileUrl && !!b.downloadUrl
});

// Trang chủ: sách admin cho hiện công khai. Không cần đăng nhập. Khai báo trước '/:id...'.
router.get('/public', asyncHandler(async (req, res) => {
  const items = (await db.all('libraryBooks')).filter(isPublic);
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(items.map(publicBook));
}));

// Link tải sách cho học viên/khách: chỉ sách đang công khai. Ưu tiên file đã tải lên, không có thì link ngoài.
router.get('/:id/download', asyncHandler(async (req, res) => {
  const book = await db.find('libraryBooks', req.params.id);
  if (!book || !isPublic(book)) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  db.update('libraryBooks', book.id, { downloads: (book.downloads || 0) + 1 }).catch(() => {});
  if (!book.fileUrl) return res.redirect(book.downloadUrl);
  if (/^https?:/i.test(book.fileUrl)) return res.redirect(book.fileUrl);
  // Chế độ lưu cục bộ: /uploads/media cần đăng nhập nên phát file trực tiếp ở đây.
  const uploadRoot = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
  const file = path.join(uploadRoot, 'media', path.basename(book.fileUrl));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'File sách không còn trên máy chủ' });
  res.download(file, book.originalName || path.basename(file));
}));

router.get('/', ...staff, asyncHandler(async (req, res) => {
  const items = await db.all('libraryBooks');
  items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(items);
}));

router.post('/', ...staff, sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  // Không có file thì phải có link tải ngoài (VD: sách quá nặng để trên Google Drive).
  if (!req.file) {
    const data = fields(req.body);
    if (!data.downloadUrl) return res.status(400).json({ error: 'Vui lòng chọn file sách hoặc nhập link tải sách' });
    if (!data.title) return res.status(400).json({ error: 'Tên sách không được để trống' });
    const book = await db.insert('libraryBooks', { ...data, uploadedBy: req.user.id, uploadedByName: req.user.name || '' });
    await db.logActivity(req.user.id, 'upload_library_book', { bookId: book.id, link: data.downloadUrl });
    return res.status(201).json(book);
  }
  // multer đọc tên file theo latin1 -> đổi lại UTF-8 để giữ dấu tiếng Việt / chữ Hán.
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const ext = path.extname(originalName).toLowerCase();
  if (!EXTS.includes(ext)) { cleanup(); return res.status(400).json({ error: 'Chỉ nhận file sách: PDF, EPUB, MOBI, Word, PowerPoint, Excel, TXT, ZIP/RAR, audio' }); }
  if (req.file.size > MAX_MB * 1024 * 1024) { cleanup(); return res.status(413).json({ error: `File quá lớn (tối đa ${MAX_MB}MB)` }); }
  try {
    const { url } = await storage.saveFile(req.file.path, originalName, req.file.mimetype);
    const data = fields(req.body);
    const book = await db.insert('libraryBooks', {
      ...data,
      title: data.title || path.basename(originalName, ext),
      fileUrl: url, originalName, size: req.file.size, mimetype: req.file.mimetype,
      uploadedBy: req.user.id, uploadedByName: req.user.name || ''
    });
    await db.logActivity(req.user.id, 'upload_library_book', { bookId: book.id, name: originalName });
    res.status(201).json(book);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải file lên thất bại' });
  } finally {
    cleanup();
  }
}));

router.put('/:id', ...staff, asyncHandler(async (req, res) => {
  const book = await db.find('libraryBooks', req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  const data = fields(req.body);
  if (!data.title) return res.status(400).json({ error: 'Tên sách không được để trống' });
  res.json(await db.update('libraryBooks', book.id, data));
}));

// Ảnh bìa sách - lưu ngay khi chọn file, phục vụ công khai (trang chủ) giống bìa khoá học.
router.post('/:id/cover', ...staff, mediaUpload.single('file'), asyncHandler(async (req, res) => {
  const book = await db.find('libraryBooks', req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file ảnh' });
  if (!COVER_TYPES.includes(req.file.mimetype)) return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF' });
  try {
    const { url } = await storage.saveCover(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json(await db.update('libraryBooks', book.id, { coverUrl: url }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải ảnh bìa lên thất bại' });
  }
}));

router.delete('/:id/cover', ...staff, asyncHandler(async (req, res) => {
  const updated = await db.update('libraryBooks', req.params.id, { coverUrl: null });
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  res.json(updated);
}));

router.delete('/:id', ...staff, asyncHandler(async (req, res) => {
  const book = await db.find('libraryBooks', req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  await db.remove('libraryBooks', book.id);
  await db.logActivity(req.user.id, 'delete_library_book', { bookId: book.id, name: book.originalName });
  res.json({ success: true });
}));

module.exports = router;
