const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * Router CRUD dùng chung cho mọi loại nội dung (từ vựng, ngữ pháp, câu, bài hát, video...).
 * Cho phép hệ thống tái sử dụng cùng một cơ chế lưu trữ/lấy dữ liệu cho nhiều dạng bài,
 * thay vì code riêng cho từng loại nội dung.
 */
function crudRoute({ collection, writeRoles = ['admin', 'teacher'], filterKeys = [] }) {
  const router = express.Router();

  router.get('/', requireAuth, (req, res) => {
    let items = db.all(collection);
    filterKeys.forEach((key) => {
      if (req.query[key] !== undefined) {
        items = items.filter((it) => String(it[key]) === String(req.query[key]));
      }
    });
    res.json(items);
  });

  router.get('/:id', requireAuth, (req, res) => {
    const item = db.find(collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(item);
  });

  router.post('/', requireAuth, requireRole(...writeRoles), (req, res) => {
    const item = db.insert(collection, req.body);
    res.status(201).json(item);
  });

  router.put('/:id', requireAuth, requireRole(...writeRoles), (req, res) => {
    const item = db.update(collection, req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(item);
  });

  router.delete('/:id', requireAuth, requireRole(...writeRoles), (req, res) => {
    const ok = db.remove(collection, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true });
  });

  return router;
}

module.exports = crudRoute;
