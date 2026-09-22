const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const access = require('../utils/access');

const router = express.Router();

// Số liệu tổng quan - đếm thật từ dữ liệu. Học viên chỉ thấy số liệu của các khoá đã được cấp quyền.
router.get('/overview', requireAuth, (req, res) => {
  const levelIds = access.allowedLevelIds(req.user);
  if (levelIds === null) {
    return res.json({
      levels: db.all('levels').length,
      lessons: db.all('lessons').length,
      words: db.all('words').length,
      sentences: db.all('sentences').length
    });
  }
  const lessonIds = access.allowedLessonIds(req.user);
  res.json({
    levels: levelIds.size,
    lessons: lessonIds.size,
    words: db.findWhere('words', (w) => lessonIds.has(w.lessonId)).length,
    sentences: db.findWhere('sentences', (s) => lessonIds.has(s.lessonId)).length
  });
});

module.exports = router;
