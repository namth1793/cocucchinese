const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
const gen = require('../utils/exerciseGenerator');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');
const { requireLessonAccess } = access;

const router = express.Router();

// Sinh động các dạng bài tập từ dữ liệu gốc của bài học (mục 15 - kiến trúc dùng chung)
router.get('/:lessonId/:type', optionalAuth, requireLessonAccess(), asyncHandler(async (req, res) => {
  const { lessonId, type } = req.params;
  const count = Math.min(parseInt(req.query.count, 10) || 8, 20);
  const words = await db.findWhere('words', (w) => w.lessonId === lessonId);
  const sentences = await db.findWhere('sentences', (s) => s.lessonId === lessonId);
  const category = req.query.category;
  const sentencePool = category ? sentences.filter((s) => s.category === category) : sentences;

  let items;
  switch (type) {
    case 'vocab-cn-vi': items = gen.shuffle(gen.mcqFromWords(words, 'cn-vi')).slice(0, count); break;
    case 'vocab-vi-cn': items = gen.shuffle(gen.mcqFromWords(words, 'vi-cn')).slice(0, count); break;
    case 'pinyin-hanzi': items = gen.shuffle(gen.pinyinToHanzi(words)).slice(0, count); break;
    case 'listen-choose': items = gen.shuffle(gen.listenChoose(words)).slice(0, count); break;
    case 'match': items = gen.matchingPairs(words, Math.min(count, words.length)); break;
    case 'memory': items = gen.memoryPairs(words, Math.min(count, words.length)); break;
    case 'arrange': items = gen.shuffle(sentencePool).slice(0, count).map(gen.arrangeSentence); break;
    case 'build-sentence': items = gen.shuffle(sentencePool).slice(0, count).map(gen.buildSentence); break;
    default: return res.status(400).json({ error: 'Loại bài tập không hợp lệ' });
  }
  res.json({ lessonId, type, items });
}));

// Khách học thử: chấm điểm vẫn chạy ở trình duyệt, chỉ không lưu tiến độ (trả guest: true).
router.post('/submit', optionalAuth, asyncHandler(async (req, res) => {
  const { lessonId, module: moduleName, itemId, itemType, correct } = req.body;
  if (!lessonId || !moduleName) return res.status(400).json({ error: 'Thiếu lessonId hoặc module' });
  if (!(await access.canAccessLesson(req.user, lessonId))) return access.deny(res);
  if (!req.user) return res.json({ guest: true });
  const prog = await db.recordResult(req.user.id, lessonId, moduleName, itemId, itemType, !!correct);
  res.json(prog);
}));

module.exports = router;
