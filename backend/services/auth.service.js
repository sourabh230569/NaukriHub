'use strict';

const jwt                        = require('jsonwebtoken');
const { getDb }                  = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');

const JWT_SECRET  = process.env.JWT_SECRET  || 'fallback_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function safeUser(user) {
  // Never return the hashed password to callers
  const { password: _pw, ...safe } = user;
  return safe;
}

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Register a new user.  Role is always forced to 'user'.
 */
async function register({ name, email, password }) {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const hashed = await hashPassword(password);
  const stmt   = db.prepare(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')`
  );
  const result = stmt.run(name.trim(), email.toLowerCase().trim(), hashed);

  const user  = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken({ id: user.id, role: user.role });

  return { user: safeUser(user), token };
}

/**
 * Authenticate with email + password.
 */
async function login({ email, password }) {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const token = generateToken({ id: user.id, role: user.role });
  return { user: safeUser(user), token };
}

/**
 * Fetch the authenticated user by id (used for GET /api/auth/me).
 */
function getMe(userId) {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return safeUser(user);
}

module.exports = { register, login, getMe };
