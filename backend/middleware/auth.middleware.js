'use strict';

const jwt        = require('jsonwebtoken');
const { getDb }  = require('../config/database');
const { sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Extract JWT from Authorization header (Bearer) or httpOnly cookie.
 */
function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

/**
 * Require a valid JWT.  Attaches req.user = { id, role, name, email }.
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return sendError(res, 401, 'Authentication required. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Confirm user still exists in DB
    const db   = getDb();
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return sendError(res, 401, 'User account no longer exists.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid authentication token.');
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present, but does
 * not reject the request if no token is provided.
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db      = getDb();
    const user    = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);
    if (user) req.user = user;
  } catch (_) {
    // Silently ignore invalid tokens for optional-auth routes
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
