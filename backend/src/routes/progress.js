const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function moduleScore(m) {
  if (!m) return null;
  if (m.completed !== undefined) return m.completed ? 100 : 0;
  if (!m.attempts) return null;
  return Math.round((m.correct / m.attempts) * 100);
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

// Chuỗi ngày học liên tiếp + các ngày đã học trong tuần này (T2-CN), tính từ
// nhật ký hoạt động thật (đăng nhập, làm bài...) - không phải số giả lập.
router.get('/streak', requireAuth, (req, res) => {
  const logs = db.findWhere('activityLogs', (l) => l.userId === req.user.id);
  const activeDates = new Set(logs.map((l) => dateKey(new Date(l.createdAt))));

  let currentStreak = 0;
  const cursor = new Date();
  while (activeDates.has(dateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7; // Thứ 2 = 0 ... Chủ nhật = 6
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const activeDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    activeDays.push(activeDates.has(dateKey(d)));
  }

  res.json({ currentStreak, activeDays });
});

router.get('/review/all', requireAuth, (req, res) => {
  const progs = db.findWhere('progress', (p) => p.userId === req.user.id);
  const words = [];
  const sentences = [];
  progs.forEach((p) => (p.wrongItems || []).forEach((w) => {
    if (w.itemType === 'word') {
      const word = db.find('words', w.itemId);
      if (word && !words.find((x) => x.id === word.id)) words.push(word);
    } else if (w.itemType === 'sentence') {
      const sentence = db.find('sentences', w.itemId);
      if (sentence && !sentences.find((x) => x.id === sentence.id)) sentences.push(sentence);
    }
  }));
  res.json({ words, sentences });
});

router.delete('/review/:itemId', requireAuth, (req, res) => {
  const progs = db.findWhere('progress', (p) => p.userId === req.user.id);
  progs.forEach((p) => {
    const wrongItems = (p.wrongItems || []).filter((w) => w.itemId !== req.params.itemId);
    if (wrongItems.length !== (p.wrongItems || []).length) db.update('progress', p.id, { wrongItems });
  });
  res.json({ success: true });
});

router.get('/:lessonId/summary', requireAuth, (req, res) => {
  const prog = db.getOrCreateProgress(req.user.id, req.params.lessonId);
  const scores = {};
  Object.keys(prog.modules || {}).forEach((key) => { scores[key] = moduleScore(prog.modules[key]); });
  const numeric = Object.values(scores).filter((v) => typeof v === 'number');
  const overallPercent = numeric.length ? Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length) : 0;
  res.json({
    lessonId: req.params.lessonId,
    scores,
    overallPercent,
    wrongWordsCount: (prog.wrongItems || []).filter((w) => w.itemType === 'word').length,
    wrongSentencesCount: (prog.wrongItems || []).filter((w) => w.itemType === 'sentence').length
  });
});

router.post('/:lessonId/complete-module', requireAuth, (req, res) => {
  const { module: moduleName } = req.body;
  const prog = db.getOrCreateProgress(req.user.id, req.params.lessonId);
  const modules = { ...prog.modules, [moduleName]: { completed: true } };
  res.json(db.update('progress', prog.id, { modules }));
});

router.get('/:lessonId', requireAuth, (req, res) => {
  res.json(db.getOrCreateProgress(req.user.id, req.params.lessonId));
});

module.exports = router;
