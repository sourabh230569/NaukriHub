'use strict';

const appService             = require('../services/application.service');
const { getDb }              = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/user/dashboard
function getDashboard(req, res, next) {
  try {
    const stats = appService.getUserStats(req.user.id);
    return sendSuccess(res, 200, 'Dashboard data retrieved.', stats);
  } catch (err) {
    next(err);
  }
}

// GET /api/user/profile
function getProfile(req, res) {
  // req.user is already attached by requireAuth middleware (no password field)
  return sendSuccess(res, 200, 'Profile retrieved.', { user: req.user });
}

// PUT /api/user/profile
async function updateProfile(req, res, next) {
  try {
    const db   = getDb();
    const { name } = req.body;

    if (!name || String(name).trim() === '') {
      return sendError(res, 400, 'Name is required.');
    }

    db.prepare(
      `UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(name.trim(), req.user.id);

    const updated = db.prepare(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?'
    ).get(req.user.id);

    return sendSuccess(res, 200, 'Profile updated successfully.', { user: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, getProfile, updateProfile };
