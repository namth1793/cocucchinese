const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * Endpoint quản trị tạm thời để nhập hàng loạt dữ liệu (dùng khi khôi phục nội
 * dung sau khi ổ đĩa production bị reset, ví dụ Railway redeploy không có
 * Volume). Nhận nguyên payload gồm nhiều collection, ghi thẳng qua db.insert
 * (giữ nguyên id/lessonId đã cho) trong 1 request duy nhất, tránh bị chặn bởi
 * rate-limit khi phải gọi hàng nghìn request POST riêng lẻ.
 */
const router = express.Router();

const COLLECTION_KEYS = [
  'lessons', 'topics', 'words', 'grammarPoints', 'sentences',
  'characters', 'dialogues', 'speakingScenarios', 'fillExercises'
];

router.post('/bulk-import', requireAuth, requireRole('admin'), (req, res) => {
  const body = req.body || {};
  const deleteLessonIds = body.deleteLessonIds || [];

  if (deleteLessonIds.length) {
    db.all('lessons').filter((l) => deleteLessonIds.includes(l.id)).forEach((l) => db.remove('lessons', l.id));
    COLLECTION_KEYS.filter((k) => k !== 'lessons').forEach((key) => {
      db.all(key).filter((item) => deleteLessonIds.includes(item.lessonId)).forEach((item) => db.remove(key, item.id));
    });
  }

  const counts = {};
  COLLECTION_KEYS.forEach((key) => {
    const items = body[key] || [];
    items.forEach((item) => db.insert(key, item));
    counts[key] = items.length;
  });

  res.json({ success: true, deleted: deleteLessonIds.length, inserted: counts });
});

module.exports = router;
