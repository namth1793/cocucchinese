const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Kho tài liệu: nơi admin/giáo viên cất file sách (giáo trình, sách bài tập, đề...) dùng chung,
// không gắn với bài học nào. Chỉ nhân sự xem được, học viên không thấy.
const MAX_MB = 500;
const EXTS = ['.pdf', '.epub', '.mobi', '.azw3', '.djvu', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar', '.7z', '.mp3', '.m4a', '.wav', '.mp4'];
const staff = [requireAuth, requireRole('admin', 'teacher')];

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
function fields(body) {
  return {
    title: clean(body.title, 200),
    author: clean(body.author, 160),
    category: clean(body.category, 80),
    note: clean(body.note, 1000)
  };
}

router.get('/', ...staff, asyncHandler(async (req, res) => {
  const items = await db.all('libraryBooks');
  items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(items);
}));

router.post('/', ...staff, sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file sách' });
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

router.delete('/:id', ...staff, asyncHandler(async (req, res) => {
  const book = await db.find('libraryBooks', req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  await db.remove('libraryBooks', book.id);
  await db.logActivity(req.user.id, 'delete_library_book', { bookId: book.id, name: book.originalName });
  res.json({ success: true });
}));

module.exports = router;
