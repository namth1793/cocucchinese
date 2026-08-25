const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'grammarPoints', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
