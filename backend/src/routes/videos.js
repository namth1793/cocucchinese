const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'videos', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
