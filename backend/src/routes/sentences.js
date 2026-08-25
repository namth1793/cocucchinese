const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'sentences', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId', 'category'] });
