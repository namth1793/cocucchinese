const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { mediaUpload } = require('../middleware/upload');
const storage = require('../storage');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  let items = db.all('images');
  if (req.query.category) items = items.filter((i) => i.category === req.query.category);
  res.json(items);
});

router.post('/', requireAuth, requireRole('admin', 'teacher'), mediaUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  try {
    const { url } = await storage.saveMedia(req.file.buffer, req.file.originalname, req.file.mimetype);
    const item = db.insert('images', {
      url,
      category: req.body.category || 'khac',
      caption: req.body.caption || '',
      uploadedBy: req.user.id
    });
    db.logActivity(req.user.id, 'upload_image', { imageId: item.id });
    res.status(201).json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải ảnh lên thất bại' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const ok = db.remove('images', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({ success: true });
});

module.exports = router;
