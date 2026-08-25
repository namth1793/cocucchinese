const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'words', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId', 'topicId'] });
