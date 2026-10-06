const db = require('../db');
const asyncHandler = require('./asyncHandler');

/**
 * Quyền truy cập khoá học (mỗi "khoá học" = 1 cấp độ / level).
 *
 * Học viên chỉ xem được nội dung của các level mà email của họ đã được cấp
 * quyền (enrollment ở trạng thái đã mua / đang học / hoàn thành). Admin và giáo
 * viên luôn xem được tất cả. Riêng FREE_LESSON_COUNT bài đầu tiên của mỗi khoá
 * đang mở bán là bài học thử: ai cũng xem được, kể cả khách chưa đăng nhập
 * (user = null). Mọi route trả nội dung bài học đều phải đi qua các hàm ở đây -
 * không tin vào việc frontend ẩn menu.
 */
const ENROLLMENT_STATUS = {
  PURCHASED: 'purchased',
  LEARNING: 'learning',
  COMPLETED: 'completed',
  REVOKED: 'revoked'
};
const ACTIVE_STATUSES = [ENROLLMENT_STATUS.PURCHASED, ENROLLMENT_STATUS.LEARNING, ENROLLMENT_STATUS.COMPLETED];

/** Số bài đầu mỗi khoá được học thử miễn phí; khoá trả phí bắt đầu từ bài kế tiếp. */
const FREE_LESSON_COUNT = 2;

const isStaff = (user) => !!user && (user.role === 'admin' || user.role === 'teacher');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

/** Khoá đang mở bán = cấp độ đã đặt học phí và không bị ẩn (cùng điều kiện với trang /courses). */
const isForSale = (level) => !!level && typeof level.price === 'number' && level.price >= 0 && level.listed !== false;

/** Thứ tự bài trong khoá - dùng chung cho lộ trình công khai và việc xác định bài học thử. */
const lessonSort = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.createdAt).localeCompare(String(b.createdAt));

// Tập id bài học thử của mọi khoá, tính 1 lần rồi dùng lại trong vài giây: được hỏi
// cho từng bản ghi khi lọc danh sách nên không thể đọc lại toàn bộ levels/lessons mỗi lần.
// Ghi lessons/levels gọi invalidateFreeLessons(); TTL ngắn lo phần còn lại (nhiều instance).
const FREE_CACHE_MS = 15 * 1000;
let freeCache = null;

async function freeLessonIds() {
  if (freeCache && freeCache.expires > Date.now()) return freeCache.ids;
  const [levels, lessons] = await Promise.all([db.all('levels'), db.all('lessons')]);
  const ids = new Set();
  levels.filter(isForSale).forEach((level) => {
    lessons.filter((l) => l.levelId === level.id).sort(lessonSort)
      .slice(0, FREE_LESSON_COUNT).forEach((l) => ids.add(l.id));
  });
  freeCache = { ids, expires: Date.now() + FREE_CACHE_MS };
  return ids;
}

function invalidateFreeLessons() {
  freeCache = null;
}

async function isFreeLesson(lessonId) {
  return (await freeLessonIds()).has(lessonId);
}

async function activeEnrollments(userId) {
  return db.findWhere('enrollments', (e) => e.userId === userId && ACTIVE_STATUSES.includes(e.status));
}

async function hasAnyAccess(user) {
  return isStaff(user) || (await activeEnrollments(user.id)).length > 0;
}

/** null = không giới hạn (staff); ngược lại là Set các levelId được phép xem (khách: rỗng). */
async function allowedLevelIds(user) {
  if (isStaff(user)) return null;
  if (!user) return new Set();
  return new Set((await activeEnrollments(user.id)).map((e) => e.levelId));
}

async function canAccessLevel(user, levelId) {
  const allowed = await allowedLevelIds(user);
  return allowed === null || allowed.has(levelId);
}

async function canAccessLesson(user, lessonId) {
  if (isStaff(user)) return true;
  if (await isFreeLesson(lessonId)) return true;
  if (!user) return false;
  const lesson = await db.find('lessons', lessonId);
  return !!lesson && canAccessLevel(user, lesson.levelId);
}

/** null = staff (mọi bài); Set lessonId cho học viên (chỉ khoá đã được cấp quyền, không tính bài học thử). */
async function allowedLessonIds(user) {
  const levels = await allowedLevelIds(user);
  if (levels === null) return null;
  const lessons = await db.findWhere('lessons', (l) => levels.has(l.levelId));
  return new Set(lessons.map((l) => l.id));
}

/** Bản ghi nội dung thuộc level nào (qua lessonId hoặc levelId); undefined nếu không gắn với khoá học. */
async function itemLevelId(item) {
  if (item.lessonId) {
    const lesson = await db.find('lessons', item.lessonId);
    return lesson ? lesson.levelId : null;
  }
  if (item.levelId) return item.levelId;
  return undefined;
}

async function canAccessItem(user, item) {
  if (item.lessonId) return canAccessLesson(user, item.lessonId);
  if (item.levelId) return canAccessLevel(user, item.levelId);
  return true;
}

/** Lần đầu học viên mở nội dung khoá học: "đã mua" -> "đang học". */
async function markLearning(user, levelId) {
  if (!user || isStaff(user)) return;
  const enr = (await db.findWhere('enrollments', (e) => e.userId === user.id && e.levelId === levelId))[0];
  if (enr && enr.status === ENROLLMENT_STATUS.PURCHASED) {
    await db.update('enrollments', enr.id, { status: ENROLLMENT_STATUS.LEARNING, startedAt: new Date().toISOString() });
  }
}

async function markLessonLearning(user, lessonId) {
  if (!user || isStaff(user)) return;
  const lesson = await db.find('lessons', lessonId);
  if (lesson) await markLearning(user, lesson.levelId);
}

/** Array.prototype.filter cho predicate bất đồng bộ (vd. canAccessItem/canAccessLesson) -
 * .filter() thường sẽ luôn giữ lại mọi phần tử vì 1 async function trả về Promise (luôn truthy). */
async function filterAsync(items, predicate) {
  const flags = await Promise.all(items.map(predicate));
  return items.filter((_, i) => flags[i]);
}

/** extra.courseId: khoá chứa nội dung bị chặn - frontend dẫn khách tới trang đăng ký đúng khoá. */
const deny = (res, extra = {}) => res.status(403).json({
  error: 'Bạn chưa được cấp quyền truy cập khoá học này.',
  code: 'NO_COURSE_ACCESS',
  ...extra
});

/** Middleware: chặn nếu không có quyền với bài học ở tham số URL (mặc định :lessonId). Chạy sau requireAuth/optionalAuth. */
function requireLessonAccess(param = 'lessonId') {
  return asyncHandler(async (req, res, next) => {
    const lesson = await db.find('lessons', req.params[param]);
    if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });
    if (!(await canAccessLesson(req.user, lesson.id))) return deny(res, { courseId: lesson.levelId });
    await markLearning(req.user, lesson.levelId);
    next();
  });
}

function requireLevelAccess(param = 'levelId') {
  return asyncHandler(async (req, res, next) => {
    if (!(await canAccessLevel(req.user, req.params[param]))) return deny(res);
    await markLearning(req.user, req.params[param]);
    next();
  });
}

/** Phần trăm tiến độ trung bình của các bài trong 1 khoá (theo % hoàn thành từng module đã làm). */
async function courseProgressPercent(userId, levelId) {
  const lessons = await db.findWhere('lessons', (l) => l.levelId === levelId);
  if (lessons.length === 0) return 0;
  let total = 0;
  for (const l of lessons) {
    const prog = (await db.findWhere('progress', (p) => p.userId === userId && p.lessonId === l.id))[0];
    const scores = Object.values((prog && prog.modules) || {}).map((m) => {
      if (m.completed !== undefined) return m.completed ? 100 : 0;
      return m.attempts ? Math.round((m.correct / m.attempts) * 100) : null;
    }).filter((v) => typeof v === 'number');
    if (scores.length) total += scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  return Math.round(total / lessons.length);
}

module.exports = {
  ENROLLMENT_STATUS, ACTIVE_STATUSES, FREE_LESSON_COUNT, isStaff, normalizeEmail, isForSale, lessonSort,
  freeLessonIds, isFreeLesson, invalidateFreeLessons,
  activeEnrollments, hasAnyAccess, allowedLevelIds, allowedLessonIds,
  canAccessLevel, canAccessLesson, canAccessItem, itemLevelId,
  markLearning, markLessonLearning, deny, requireLessonAccess, requireLevelAccess, courseProgressPercent,
  filterAsync
};
