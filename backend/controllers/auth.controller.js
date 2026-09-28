'use strict';

const authService        = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure:   process.env.NODE_ENV === 'production',
  maxAge:   7 * 24 * 60 * 60 * 1000 // 7 days in ms
};

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { user, token } = await authService.register(req.body);
    res.cookie('token', token, COOKIE_OPTS);
    return sendSuccess(res, 201, 'Account created successfully.', { user, token });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    res.cookie('token', token, COOKIE_OPTS);
    return sendSuccess(res, 200, 'Login successful.', { user, token });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return sendSuccess(res, 200, 'Logged out successfully.');
}

// GET /api/auth/me
function me(req, res, next) {
  try {
    const user = authService.getMe(req.user.id);
    return sendSuccess(res, 200, 'User retrieved.', { user });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

module.exports = { register, login, logout, me };
