const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');
const { isWorkbook, workbookParentId } = require('../utils/workbooks');

const router = express.Router();

/** Thông tin công khai của 1 khoá (không chứa nội dung bài học). */
async function publicCourse(level) {
  const lessons = await db.findWhere('lessons', (l) => l.levelId === level.id);
  return {
    id: level.id, code: level.code, name: level.name, type: level.type,
    category: level.category, group: level.group || '',
    coverUrl: level.coverUrl || null,
    price: level.price ?? null,
    description: level.description || '',
    duration: level.duration || '',
    audience: level.audience || '',
    outcomes: Array.isArray(level.outcomes) ? level.outcomes : [],
    lessonCount: lessons.length,
    // Mở toàn bộ (OPEN_ACCESS): mọi bài miễn phí, frontend ẩn giá/form đăng ký.
    openAccess: access.OPEN_ACCESS,
    // Số bài học thử miễn phí thực có (khoá ít bài hơn FREE_LESSON_COUNT thì ít hơn); 0 nếu chưa mở bán.
    freeLessons: access.OPEN_ACCESS ? lessons.length
      : isListed(level) ? Math.min(lessons.length, access.FREE_LESSON_COUNT) : 0
  };
}

// Khoá được bán = cấp độ đã đặt học phí (và không bị ẩn). Không cần đăng nhập.
const isListed = access.isForSale;

router.get('/', asyncHandler(async (req, res) => {
  const all = await db.all('levels');
  const levels = all.filter((l) => access.isOpenCourse(l) && !isWorkbook(l, all)).sort((a, b) => (a.order || 0) - (b.order || 0));
  const items = await Promise.all(levels.map(publicCourse));
  res.json(items);
}));

// Danh mục cho trang chủ công khai: mọi cấp độ không bị ẩn (kể cả chưa đặt học phí -
// hiện "Sắp mở", không có link đăng ký) + số liệu tổng. Chỉ thông tin giới thiệu, không lộ nội dung.
router.get('/catalog', asyncHandler(async (req, res) => {
  // Sách bài tập nằm trong khoá chính (mục "Sách bài tập"), không hiện thành khoá riêng.
  const all = await db.all('levels');
  const levels = all.filter((l) => l.listed !== false && !isWorkbook(l, all))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const courses = await Promise.all(levels.map(async (l) => ({ ...(await publicCourse(l)), forSale: access.isOpenCourse(l) })));
  const [lessons, words, sentences] = await Promise.all([db.all('lessons'), db.all('words'), db.all('sentences')]);
  res.json({
    courses,
    stats: { courses: courses.length, lessons: lessons.length, words: words.length, sentences: sentences.length }
  });
}));

// Học viên: các khoá của tôi + trạng thái + tiến độ. Phải khai báo trước '/:id'.
router.get('/mine/list', requireAuth, asyncHandler(async (req, res) => {
  const enrollments = await db.findWhere('enrollments', (e) => e.userId === req.user.id && access.ACTIVE_STATUSES.includes(e.status));
  const items = (await Promise.all(enrollments.map(async (e) => {
    const level = await db.find('levels', e.levelId);
    if (!level) return null;
    return {
      enrollmentId: e.id, status: e.status, grantedAt: e.grantedAt,
      startedAt: e.startedAt || null, completedAt: e.completedAt || null,
      progressPercent: await access.courseProgressPercent(req.user.id, level.id),
      course: await publicCourse(level)
    };
  }))).filter(Boolean);
  res.json(items);
}));

// Chi tiết + lộ trình: chỉ tiêu đề/mô tả từng bài, không lộ từ vựng, bài tập, file...
// free = bài học thử (vào học được ngay không cần đăng nhập).
router.get('/:id', asyncHandler(async (req, res) => {
  const level = await db.find('levels', req.params.id);
  if (!level || !access.isOpenCourse(level)) return res.status(404).json({ error: 'Không tìm thấy khoá học' });
  const roadmapOf = async (levelId) => (await db.findWhere('lessons', (l) => l.levelId === levelId))
    .sort(access.lessonSort)
    .map((l, i) => ({ id: l.id, order: l.order, title: l.title, description: l.description || '', free: access.OPEN_ACCESS || i < access.FREE_LESSON_COUNT }));
  const lessons = await roadmapOf(level.id);
  const allLevels = await db.all('levels');
  const workbooks = await Promise.all(allLevels
    .filter((l) => l.listed !== false && workbookParentId(l, allLevels) === level.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(async (l) => ({ id: l.id, code: l.code, name: l.name, lessons: await roadmapOf(l.id) })));
  const lessonIds = new Set(lessons.map((l) => l.id));
  const [words, grammarPoints, sentences, tests] = await Promise.all([
    db.findWhere('words', (w) => lessonIds.has(w.lessonId)),
    db.findWhere('grammarPoints', (g) => lessonIds.has(g.lessonId)),
    db.findWhere('sentences', (s) => lessonIds.has(s.lessonId)),
    db.findWhere('courseTests', (t) => t.levelId === level.id && t.fileKey && t.published !== false)
  ]);
  res.json({
    ...(await publicCourse(level)),
    roadmap: lessons,
    workbooks,
    tests: tests.sort(access.lessonSort).map((t) => ({ id: t.id, title: t.title })),
    stats: { words: words.length, grammarPoints: grammarPoints.length, sentences: sentences.length }
  });
}));

module.exports = router;
