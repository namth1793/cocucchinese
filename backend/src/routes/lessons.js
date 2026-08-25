const crudRoute = require('../utils/crudRoute');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = crudRoute({ collection: 'lessons', writeRoles: ['admin', 'teacher'], filterKeys: ['levelId'] });

// Gộp toàn bộ nội dung 1 bài học (từ vựng, ngữ pháp, câu, ppt, bài hát, video) trong 1 lần gọi
router.get('/:id/full', requireAuth, (req, res) => {
  const lesson = db.find('lessons', req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });
  const words = db.findWhere('words', (w) => w.lessonId === lesson.id);
  const grammarPoints = db.findWhere('grammarPoints', (g) => g.lessonId === lesson.id);
  const sentences = db.findWhere('sentences', (s) => s.lessonId === lesson.id);
  const slides = db.findWhere('slides', (s) => s.lessonId === lesson.id)
    .map((s) => ({ id: s.id, title: s.title, pageCount: s.pages.length }));
  const songs = db.findWhere('songs', (s) => s.lessonId === lesson.id);
  const videos = db.findWhere('videos', (v) => v.lessonId === lesson.id);
  res.json({ lesson, words, grammarPoints, sentences, slides, songs, videos });
});

module.exports = router;
