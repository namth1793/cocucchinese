const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'topics', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
