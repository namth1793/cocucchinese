const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'characters', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
