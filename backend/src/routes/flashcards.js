const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/:lessonId', optionalAuth, access.requireLessonAccess(), asyncHandler(async (req, res) => {
  const words = await db.findWhere('words', (w) => w.lessonId === req.params.lessonId);
  const statuses = req.user ? await db.findWhere('flashcardStatus', (f) => f.userId === req.user.id) : [];
  const items = words.map((w) => {
    const st = statuses.find((s) => s.wordId === w.id);
    return { ...w, flashcardStatus: st ? st.status : null };
  });
  res.json(items);
}));

router.post('/:wordId/status', optionalAuth, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['known', 'half', 'unknown'].includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  const word = await db.find('words', req.params.wordId);
  if (!word) return res.status(404).json({ error: 'Không tìm thấy từ' });
  if (!(await access.canAccessLesson(req.user, word.lessonId))) return access.deny(res);
  // Khách học thử: trạng thái chỉ giữ trên màn hình, không lưu.
  if (!req.user) return res.json({ wordId: word.id, status, guest: true });
  const doc = await db.upsertFlashcard(req.user.id, req.params.wordId, status);

  const prog = await db.getOrCreateProgress(req.user.id, word.lessonId);
  let wrongItems = prog.wrongItems || [];
  if (status === 'unknown') {
    if (!wrongItems.find((w) => w.itemId === word.id)) {
      wrongItems = [...wrongItems, { itemId: word.id, itemType: 'word', lessonId: word.lessonId, addedAt: new Date().toISOString() }];
    }
  } else {
    wrongItems = wrongItems.filter((w) => w.itemId !== word.id);
  }
  await db.update('progress', prog.id, { wrongItems });
  res.json(doc);
}));

module.exports = router;
