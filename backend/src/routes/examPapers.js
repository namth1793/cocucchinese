const fs = require('fs');
const crudRoute = require('../utils/crudRoute');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sourceFileUpload } = require('../middleware/upload');
const storage = require('../storage');
const asyncHandler = require('../utils/asyncHandler');

const router = crudRoute({ collection: 'examPapers', writeRoles: ['admin', 'teacher'], filterKeys: ['levelId', 'group'] });

// Đề thi thử là 1 trang HTML tự chứa (có thể tới hàng trăm MB do nhúng ảnh/audio) -
// tải lên riêng qua route này sau khi đã tạo bản ghi metadata (group/order/title).
router.post('/:id/file', requireAuth, requireRole('admin', 'teacher'), sourceFileUpload.single('file'), asyncHandler(async (req, res) => {
  const item = await db.find('examPapers', req.params.id);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  try {
    const { url } = await storage.saveExamFile(req.file.path, req.file.originalname, 'text/html; charset=utf-8');
    fs.unlink(req.file.path, () => {});
    const updated = await db.update('examPapers', item.id, { url });
    res.json(updated);
  } catch (e) {
    console.error(e);
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Tải file đề thi lên thất bại' });
  }
}));

module.exports = router;
