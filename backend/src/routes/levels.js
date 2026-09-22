const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const access = require('../utils/access');
const { mediaUpload } = require('../middleware/upload');
const storage = require('../storage');

const router = express.Router();

/**
 * Loại cấp độ luôn quyết định danh mục/nhóm con hiển thị ở sidebar - admin
 * chỉ cần chọn "Loại", không cần tự chọn danh mục/nhóm con thủ công (tránh
 * chọn sai khiến cấp độ "lạc" khỏi đúng mục trên sidebar).
 */
const TYPE_PLACEMENT = {
  HSK: { category: 'hsk_hskk', group: 'HSK 3.0' },
  HSKK: { category: 'hsk_hskk', group: 'HSKK' },
  YCT: { category: 'kids', group: '' },
  KIDS: { category: 'kids', group: '' },
  CONVO: { category: 'conversation', group: '' }
};

function withPlacement(body) {
  const placement = TYPE_PLACEMENT[body.type];
  return placement ? { ...body, ...placement } : body;
}

// Học viên chỉ thấy các cấp độ/khoá học đã được cấp quyền (catalog công khai nằm ở /api/courses).
router.get('/', requireAuth, (req, res) => {
  let items = db.all('levels');
  const allowed = access.allowedLevelIds(req.user);
  if (allowed) items = items.filter((it) => allowed.has(it.id));
  if (req.query.type !== undefined) items = items.filter((it) => String(it.type) === String(req.query.type));
  res.json(items);
});

router.get('/:id', requireAuth, (req, res) => {
  const item = db.find('levels', req.params.id);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
  if (!access.canAccessLevel(req.user, item.id)) return access.deny(res);
  res.json(item);
});

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  res.status(201).json(db.insert('levels', withPlacement(req.body)));
});

router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const item = db.update('levels', req.params.id, withPlacement(req.body));
  if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(item);
});

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Admin tải ảnh bìa (dạng bìa sách) cho cấp độ/khoá học - hiện ở trang chủ, danh sách và chi tiết khoá.
router.post('/:id/cover', requireAuth, requireRole('admin'), mediaUpload.single('file'), async (req, res) => {
  const level = db.find('levels', req.params.id);
  if (!level) return res.status(404).json({ error: 'Không tìm thấy' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file ảnh' });
  if (!COVER_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF' });
  }
  try {
    const { url } = await storage.saveCover(req.file.buffer, req.file.originalname, req.file.mimetype);
    const updated = db.update('levels', level.id, { coverUrl: url });
    db.logActivity(req.user.id, 'level_cover_upload', { levelId: level.id });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải ảnh bìa lên thất bại' });
  }
});

router.delete('/:id/cover', requireAuth, requireRole('admin'), (req, res) => {
  const updated = db.update('levels', req.params.id, { coverUrl: null });
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(updated);
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const ok = db.remove('levels', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({ success: true });
});

module.exports = router;
