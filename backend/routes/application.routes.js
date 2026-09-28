'use strict';

const router     = require('express').Router();
const controller = require('../controllers/application.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// POST /api/jobs/:jobId/apply  — authenticated users only
// Note: this route is mounted under /api/applications but the apply endpoint
// lives at /api/jobs/:jobId/apply so it is wired in job.routes.js too.
// We handle it here and re-export so server.js can use one router.

// GET /api/applications/my  — logged-in user's own applications
router.get('/my', requireAuth, requireRole('user'), controller.getMyApplications);

// GET /api/applications/:id  — user can view own; admin can view any
router.get('/:id', requireAuth, controller.getApplicationById);

module.exports = router;
