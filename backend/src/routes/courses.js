const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const access = require('../utils/access');
const asyncHandler = require('../utils/asyncHandler');

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
    lessonCount: lessons.length
  };
}

// Khoá được bán = cấp độ đã đặt học phí (và không bị ẩn). Không cần đăng nhập.
const isListed = (level) => typeof level.price === 'number' && level.price >= 0 && level.listed !== false;

router.get('/', asyncHandler(async (req, res) => {
  const levels = (await db.all('levels')).filter(isListed).sort((a, b) => (a.order || 0) - (b.order || 0));
  const items = await Promise.all(levels.map(publicCourse));
  res.json(items);
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
router.get('/:id', asyncHandler(async (req, res) => {
  const level = await db.find('levels', req.params.id);
  if (!level || !isListed(level)) return res.status(404).json({ error: 'Không tìm thấy khoá học' });
  const lessons = (await db.findWhere('lessons', (l) => l.levelId === level.id))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((l) => ({ id: l.id, order: l.order, title: l.title, description: l.description || '' }));
  const lessonIds = new Set(lessons.map((l) => l.id));
  const [words, grammarPoints, sentences] = await Promise.all([
    db.findWhere('words', (w) => lessonIds.has(w.lessonId)),
    db.findWhere('grammarPoints', (g) => lessonIds.has(g.lessonId)),
    db.findWhere('sentences', (s) => lessonIds.has(s.lessonId))
  ]);
  res.json({
    ...(await publicCourse(level)),
    roadmap: lessons,
    stats: { words: words.length, grammarPoints: grammarPoints.length, sentences: sentences.length }
  });
}));

module.exports = router;
