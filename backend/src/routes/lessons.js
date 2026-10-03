const crudRoute = require('../utils/crudRoute');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = crudRoute({ collection: 'lessons', writeRoles: ['admin', 'teacher'], filterKeys: ['levelId'] });

// Gộp toàn bộ nội dung 1 bài học (từ vựng, ngữ pháp, câu, ppt, bài hát, video) trong 1 lần gọi
router.get('/:id/full', requireAuth, asyncHandler(async (req, res) => {
  const lesson = await db.find('lessons', req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });
  if (!(await access.canAccessLevel(req.user, lesson.levelId))) return access.deny(res);
  await access.markLearning(req.user, lesson.levelId);
  const staff = access.isStaff(req.user);
  const [words, grammarPoints, sentences, slidesRaw, songs, videos, htmlRaw, documents] = await Promise.all([
    db.findWhere('words', (w) => w.lessonId === lesson.id),
    db.findWhere('grammarPoints', (g) => g.lessonId === lesson.id),
    db.findWhere('sentences', (s) => s.lessonId === lesson.id),
    db.findWhere('slides', (s) => s.lessonId === lesson.id),
    db.findWhere('songs', (s) => s.lessonId === lesson.id),
    db.findWhere('videos', (v) => v.lessonId === lesson.id),
    db.findWhere('htmlPages', (p) => p.lessonId === lesson.id && p.fileKey && (staff || p.published !== false)),
    db.findWhere('lessonDocuments', (d) => d.lessonId === lesson.id)
  ]);
  const htmlPages = htmlRaw.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((p) => ({ id: p.id, title: p.title, order: p.order }));
  const slides = slidesRaw.map((s) => ({ id: s.id, title: s.title, pageCount: s.pages.length }));
  res.json({ lesson, words, grammarPoints, sentences, slides, songs, videos, htmlPages, documents });
}));

module.exports = router;
