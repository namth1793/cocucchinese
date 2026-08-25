const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'songs', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
