const express = require('express');
const db = require('../db');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const access = require('./access');
const asyncHandler = require('./asyncHandler');

/**
 * Router CRUD dùng chung cho mọi loại nội dung (từ vựng, ngữ pháp, câu, bài hát, video...).
 * Cho phép hệ thống tái sử dụng cùng một cơ chế lưu trữ/lấy dữ liệu cho nhiều dạng bài,
 * thay vì code riêng cho từng loại nội dung.
 */
function crudRoute({ collection, writeRoles = ['admin', 'teacher'], filterKeys = [] }) {
  const router = express.Router();

  // Bản ghi bài học (collection lessons) tự là 1 bài - kiểm tra theo chính id của nó để bài
  // học thử mở được; các collection khác kiểm tra qua lessonId/levelId của bản ghi.
  const canRead = collection === 'lessons'
    ? (user, item) => access.canAccessLesson(user, item.id)
    : (user, item) => access.canAccessItem(user, item);

  // Học viên chỉ đọc được bản ghi thuộc khoá học đã được cấp quyền (qua lessonId hoặc
  // levelId) hoặc bài học thử miễn phí; danh sách tự lọc bỏ phần còn lại, truy cập trực
  // tiếp theo id/lessonId của khoá khác trả 403. Staff không bị giới hạn. Khách chưa đăng
  // nhập chỉ được hỏi theo lessonId (danh sách của đúng 1 bài).
  router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    if (!req.user && req.query.lessonId === undefined) return res.status(401).json({ error: 'Chưa đăng nhập' });
    if (req.query.lessonId !== undefined && !(await access.canAccessLesson(req.user, String(req.query.lessonId)))) {
      return access.deny(res);
    }
    if (req.query.lessonId !== undefined) await access.markLessonLearning(req.user, String(req.query.lessonId));
    if (req.query.levelId !== undefined && !(await access.canAccessLevel(req.user, String(req.query.levelId)))) {
      return access.deny(res);
    }
    let items = await db.all(collection);
    filterKeys.forEach((key) => {
      if (req.query[key] !== undefined) {
        items = items.filter((it) => String(it[key]) === String(req.query[key]));
      }
    });
    if (!access.isStaff(req.user)) items = await access.filterAsync(items, (it) => canRead(req.user, it));
    res.json(items);
  }));

  router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const item = await db.find(collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    if (!(await canRead(req.user, item))) {
      return access.deny(res, collection === 'lessons' ? { courseId: item.levelId } : {});
    }
    res.json(item);
  }));

  router.post('/', requireAuth, requireRole(...writeRoles), asyncHandler(async (req, res) => {
    const item = await db.insert(collection, req.body);
    if (collection === 'lessons') access.invalidateFreeLessons();
    res.status(201).json(item);
  }));

  router.put('/:id', requireAuth, requireRole(...writeRoles), asyncHandler(async (req, res) => {
    const item = await db.update(collection, req.params.id, req.body);
    if (collection === 'lessons') access.invalidateFreeLessons();
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(item);
  }));

  router.delete('/:id', requireAuth, requireRole(...writeRoles), asyncHandler(async (req, res) => {
    const ok = await db.remove(collection, req.params.id);
    if (collection === 'lessons') access.invalidateFreeLessons();
    if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true });
  }));

  return router;
}

module.exports = crudRoute;
