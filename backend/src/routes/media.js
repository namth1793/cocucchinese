const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Loại file cho phép theo mục đích - audio cho từ/câu/hội thoại, document cho tài liệu đính kèm bài học.
const KINDS = {
  audio: { maxMb: 30, exts: ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.webm'], label: 'file âm thanh (mp3, m4a, wav, ogg)' },
  document: {
    maxMb: 100,
    exts: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.m4a', '.wav'],
    label: 'tài liệu (PDF, Word, Excel, PowerPoint, ảnh, audio, zip)'
  }
};

/**
 * Tải 1 file lên và trả về URL - nơi gọi (form từ vựng, câu, hội thoại, tài liệu...) tự lưu URL
 * vào bản ghi của mình. Tách riêng để mọi loại nội dung dùng chung 1 cách upload.
 */
router.post('/', requireAuth, requireRole('admin', 'teacher'), sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  const kind = KINDS[req.body.kind] ? req.body.kind : 'document';
  const rule = KINDS[kind];
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  if (!rule.exts.includes(ext)) { cleanup(); return res.status(400).json({ error: `Chỉ nhận ${rule.label}` }); }
  if (req.file.size > rule.maxMb * 1024 * 1024) { cleanup(); return res.status(413).json({ error: `File quá lớn (tối đa ${rule.maxMb}MB)` }); }
  try {
    const { url } = await storage.saveFile(req.file.path, req.file.originalname, req.file.mimetype);
    await db.logActivity(req.user.id, 'upload_media', { kind, name: req.file.originalname });
    res.status(201).json({ url, originalName: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải file lên thất bại' });
  } finally {
    cleanup();
  }
}));

module.exports = router;
