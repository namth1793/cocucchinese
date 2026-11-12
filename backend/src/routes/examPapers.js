const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const crudRoute = require('../utils/crudRoute');
const db = require('../db');
const { requireAuth, optionalAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const access = require('../utils/access');
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

// File đề lưu trên ổ đĩa server (/uploads/media/...) cần đăng nhập, mà iframe không gửi được header
// Authorization -> xem qua token ngắn hạn giống bài học HTML. File trên R2 (URL http) mở thẳng.
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
const localFile = (url) => (typeof url === 'string' && url.startsWith('/uploads/media/')
  ? path.join(UPLOAD_ROOT, 'media', path.basename(url)) : null);

router.get('/:id/token', optionalAuth, asyncHandler(async (req, res) => {
  const item = await db.find('examPapers', req.params.id);
  if (!item || !item.url) return res.status(404).json({ error: 'Đề thi chưa có file' });
  if (!(await access.canAccessItem(req.user, item))) return access.deny(res, { courseId: item.levelId });
  const claims = req.user ? { sub: req.user.id, jti: req.jti } : { guest: true };
  res.json({ token: jwt.sign({ ...claims, examPaperId: item.id }, JWT_SECRET, { expiresIn: '5m' }) });
}));

router.get('/:id/view', asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.token || ''), JWT_SECRET);
  } catch (e) {
    return res.status(401).send('Liên kết đã hết hạn, vui lòng tải lại trang.');
  }
  if (payload.examPaperId !== req.params.id) return res.status(403).send('Liên kết không hợp lệ.');
  const user = payload.guest ? null : await db.find('users', payload.sub);
  if (!payload.guest && (!user || !(user.activeSessions || []).some((s) => s.jti === payload.jti))) {
    return res.status(401).send('Phiên đăng nhập không còn hiệu lực.');
  }
  const item = await db.find('examPapers', req.params.id);
  if (!item || !item.url) return res.status(404).send('Không tìm thấy đề thi.');
  if (!(await access.canAccessItem(user, item))) return res.status(403).send('Bạn chưa được cấp quyền truy cập khoá học này.');
  const file = localFile(item.url);
  if (!file) return res.redirect(item.url);
  if (!fs.existsSync(file)) return res.status(404).send('File đề thi không tồn tại trên máy chủ.');
  const frontend = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  res.removeHeader('X-Frame-Options');
  res.set('Content-Security-Policy', `frame-ancestors 'self' ${frontend.length ? frontend.join(' ') : '*'}`);
  res.set('Cache-Control', 'no-store');
  res.type('html').sendFile(file);
}));

module.exports = router;
