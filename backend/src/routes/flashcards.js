const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:lessonId', requireAuth, (req, res) => {
  const words = db.findWhere('words', (w) => w.lessonId === req.params.lessonId);
  const statuses = db.findWhere('flashcardStatus', (f) => f.userId === req.user.id);
  const items = words.map((w) => {
    const st = statuses.find((s) => s.wordId === w.id);
    return { ...w, flashcardStatus: st ? st.status : null };
  });
  res.json(items);
});

router.post('/:wordId/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['known', 'half', 'unknown'].includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  const doc = db.upsertFlashcard(req.user.id, req.params.wordId, status);

  const word = db.find('words', req.params.wordId);
  if (word) {
    const prog = db.getOrCreateProgress(req.user.id, word.lessonId);
    let wrongItems = prog.wrongItems || [];
    if (status === 'unknown') {
      if (!wrongItems.find((w) => w.itemId === word.id)) {
        wrongItems = [...wrongItems, { itemId: word.id, itemType: 'word', lessonId: word.lessonId, addedAt: new Date().toISOString() }];
      }
    } else {
      wrongItems = wrongItems.filter((w) => w.itemId !== word.id);
    }
    db.update('progress', prog.id, { wrongItems });
  }
  res.json(doc);
});

module.exports = router;
