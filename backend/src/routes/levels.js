const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

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

router.get('/', requireAuth, (req, res) => {
  let items = db.all('levels');
  if (req.query.type !== undefined) items = items.filter((it) => String(it.type) === String(req.query.type));
  res.json(items);
});

router.get('/:id', requireAuth, (req, res) => {
  const item = db.find('levels', req.params.id);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
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

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const ok = db.remove('levels', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({ success: true });
});

module.exports = router;
