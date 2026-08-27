const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'instructors', writeRoles: ['admin', 'teacher'] });
