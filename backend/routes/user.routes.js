'use strict';

const router     = require('express').Router();
const controller = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All user routes require authentication + user role
router.use(requireAuth, requireRole('user'));

// GET  /api/user/dashboard
router.get('/dashboard', controller.getDashboard);

// GET  /api/user/profile
router.get('/profile', controller.getProfile);

// PUT  /api/user/profile
router.put('/profile', controller.updateProfile);

module.exports = router;
