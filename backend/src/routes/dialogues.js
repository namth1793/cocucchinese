const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'dialogues', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
