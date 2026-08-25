const crudRoute = require('../utils/crudRoute');

module.exports = crudRoute({ collection: 'levels', writeRoles: ['admin'], filterKeys: ['type'] });
