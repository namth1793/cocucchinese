const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const access = require('../utils/access');

const router = express.Router();

/** Thông tin công khai của 1 khoá (không chứa nội dung bài học). */
function publicCourse(level) {
  const lessons = db.findWhere('lessons', (l) => l.levelId === level.id);
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

router.get('/', (req, res) => {
  const items = db.all('levels').filter(isListed)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(publicCourse);
  res.json(items);
});

// Học viên: các khoá của tôi + trạng thái + tiến độ. Phải khai báo trước '/:id'.
router.get('/mine/list', requireAuth, (req, res) => {
  const enrollments = db.findWhere('enrollments', (e) => e.userId === req.user.id && access.ACTIVE_STATUSES.includes(e.status));
  const items = enrollments.map((e) => {
    const level = db.find('levels', e.levelId);
    if (!level) return null;
    return {
      enrollmentId: e.id, status: e.status, grantedAt: e.grantedAt,
      startedAt: e.startedAt || null, completedAt: e.completedAt || null,
      progressPercent: access.courseProgressPercent(req.user.id, level.id),
      course: publicCourse(level)
    };
  }).filter(Boolean);
  res.json(items);
});

// Chi tiết + lộ trình: chỉ tiêu đề/mô tả từng bài, không lộ từ vựng, bài tập, file...
router.get('/:id', (req, res) => {
  const level = db.find('levels', req.params.id);
  if (!level || !isListed(level)) return res.status(404).json({ error: 'Không tìm thấy khoá học' });
  const lessons = db.findWhere('lessons', (l) => l.levelId === level.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((l) => ({ id: l.id, order: l.order, title: l.title, description: l.description || '' }));
  const lessonIds = new Set(lessons.map((l) => l.id));
  res.json({
    ...publicCourse(level),
    roadmap: lessons,
    stats: {
      words: db.findWhere('words', (w) => lessonIds.has(w.lessonId)).length,
      grammarPoints: db.findWhere('grammarPoints', (g) => lessonIds.has(g.lessonId)).length,
      sentences: db.findWhere('sentences', (s) => lessonIds.has(s.lessonId)).length
    }
  });
});

module.exports = router;
