const crudRoute = require('../utils/crudRoute');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { mediaUpload } = require('../middleware/upload');
const storage = require('../storage');

const router = crudRoute({ collection: 'dialogues', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });

// Tải file mp3 lên để thay cho giọng đọc máy (TTS) khi nghe bài khoá - dùng khi
// giáo viên muốn học sinh nghe giọng đọc thật thay vì giọng tổng hợp.
router.post('/:id/audio', requireAuth, requireRole('admin', 'teacher'), mediaUpload.single('file'), async (req, res) => {
  const dialogue = db.find('dialogues', req.params.id);
  if (!dialogue) return res.status(404).json({ error: 'Không tìm thấy bài khoá' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
  try {
    const { url } = await storage.saveMedia(req.file.buffer, req.file.originalname, req.file.mimetype);
    const updated = db.update('dialogues', dialogue.id, { audioUrl: url });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tải file nghe lên thất bại' });
  }
});

router.delete('/:id/audio', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const dialogue = db.find('dialogues', req.params.id);
  if (!dialogue) return res.status(404).json({ error: 'Không tìm thấy bài khoá' });
  const updated = db.update('dialogues', dialogue.id, { audioUrl: null });
  res.json(updated);
});

module.exports = router;
