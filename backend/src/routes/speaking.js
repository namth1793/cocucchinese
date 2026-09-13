const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'speakingScenarios', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
