const crudRoute = require('../utils/crudRoute');

// Tài liệu đính kèm bài học (PDF, Word, ảnh...) - file tải lên qua /api/media, bản ghi chỉ giữ URL.
module.exports = crudRoute({ collection: 'lessonDocuments', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
