'use strict';

const { sendError } = require('../utils/response');

/**
 * Factory — returns middleware that allows only the given role(s).
 * Must be used AFTER requireAuth so req.user is populated.
 *
 * Usage:
 *   router.post('/', requireAuth, requireRole('admin'), handler);
 *   router.get('/',  requireAuth, requireRole('admin', 'user'), handler);
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'You do not have permission to perform this action.');
    }
    next();
  };
}

module.exports = { requireRole };
