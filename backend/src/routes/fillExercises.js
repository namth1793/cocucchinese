const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'fillExercises', writeRoles: ['admin', 'teacher'], filterKeys: ['lessonId'] });
