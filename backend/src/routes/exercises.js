const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const gen = require('../utils/exerciseGenerator');

const router = express.Router();

// Sinh động các dạng bài tập từ dữ liệu gốc của bài học (mục 15 - kiến trúc dùng chung)
router.get('/:lessonId/:type', requireAuth, (req, res) => {
  const { lessonId, type } = req.params;
  const count = Math.min(parseInt(req.query.count, 10) || 8, 20);
  const words = db.findWhere('words', (w) => w.lessonId === lessonId);
  const sentences = db.findWhere('sentences', (s) => s.lessonId === lessonId);
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
});

router.post('/submit', requireAuth, (req, res) => {
  const { lessonId, module: moduleName, itemId, itemType, correct } = req.body;
  if (!lessonId || !moduleName) return res.status(400).json({ error: 'Thiếu lessonId hoặc module' });
  const prog = db.recordResult(req.user.id, lessonId, moduleName, itemId, itemType, !!correct);
  res.json(prog);
});

module.exports = router;
