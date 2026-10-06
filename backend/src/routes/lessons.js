const crudRoute = require('../utils/crudRoute');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

const router = crudRoute({ collection: 'lessons', writeRoles: ['admin', 'teacher'], filterKeys: ['levelId'] });

// Gộp toàn bộ nội dung 1 bài học (từ vựng, ngữ pháp, câu, ppt, bài hát, video) trong 1 lần gọi.
// Bài học thử miễn phí mở cho cả khách chưa đăng nhập.
router.get('/:id/full', optionalAuth, asyncHandler(async (req, res) => {
  const lesson = await db.find('lessons', req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });
  if (!(await access.canAccessLesson(req.user, lesson.id))) return access.deny(res, { courseId: lesson.levelId });
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
  const freeTrial = !(await access.canAccessLevel(req.user, lesson.levelId));
  res.json({ lesson, freeTrial, words, grammarPoints, sentences, slides, songs, videos, htmlPages, documents });
}));

// Cổng giao diện của trang học hỏi nhanh: bài này mở được không, theo diện học thử hay đã có quyền khoá.
router.get('/:id/access', optionalAuth, asyncHandler(async (req, res) => {
  const lesson = await db.find('lessons', req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });
  if (!(await access.canAccessLesson(req.user, lesson.id))) return access.deny(res, { courseId: lesson.levelId });
  const freeTrial = !(await access.canAccessLevel(req.user, lesson.levelId));
  const level = freeTrial ? await db.find('levels', lesson.levelId) : null;
  res.json({
    lessonId: lesson.id, courseId: lesson.levelId, freeTrial,
    courseName: level ? level.name : null, freeLessonCount: access.FREE_LESSON_COUNT
  });
}));

module.exports = router;
