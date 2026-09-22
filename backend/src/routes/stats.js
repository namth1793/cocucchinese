const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Số liệu tổng quan - đếm thật từ dữ liệu. Học viên chỉ thấy số liệu của các khoá đã được cấp quyền.
router.get('/overview', requireAuth, asyncHandler(async (req, res) => {
  const levelIds = await access.allowedLevelIds(req.user);
  if (levelIds === null) {
    const [levels, lessons, words, sentences] = await Promise.all([
      db.all('levels'), db.all('lessons'), db.all('words'), db.all('sentences')
    ]);
    return res.json({ levels: levels.length, lessons: lessons.length, words: words.length, sentences: sentences.length });
  }
  const lessonIds = await access.allowedLessonIds(req.user);
  const [words, sentences] = await Promise.all([
    db.findWhere('words', (w) => lessonIds.has(w.lessonId)),
    db.findWhere('sentences', (s) => lessonIds.has(s.lessonId))
  ]);
  res.json({ levels: levelIds.size, lessons: lessonIds.size, words: words.length, sentences: sentences.length });
}));

module.exports = router;
