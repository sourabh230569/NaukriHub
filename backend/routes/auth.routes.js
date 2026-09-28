'use strict';

const router     = require('express').Router();
const controller = require('../controllers/auth.controller');
const { requireAuth }         = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');

// POST /api/auth/register
router.post('/register', validateRegister, controller.register);

// POST /api/auth/login
router.post('/login', validateLogin, controller.login);

// POST /api/auth/logout
router.post('/logout', controller.logout);

// GET /api/auth/me  — requires a valid session
router.get('/me', requireAuth, controller.me);

module.exports = router;
