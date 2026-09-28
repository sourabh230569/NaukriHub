'use strict';

const router      = require('express').Router();
const controller  = require('../controllers/job.controller');
const appCtrl     = require('../controllers/application.controller');
const { requireAuth, optionalAuth }  = require('../middleware/auth.middleware');
const { requireRole }                = require('../middleware/role.middleware');
const { validateJob }                = require('../middleware/validation.middleware');

// GET /api/jobs          — public, but enriched with hasApplied if user is logged in
router.get('/', optionalAuth, controller.listJobs);

// GET /api/jobs/:id      — public, enriched with hasApplied if user is logged in
router.get('/:id', optionalAuth, controller.getJob);

// POST /api/jobs         — admin only
router.post('/', requireAuth, requireRole('admin'), validateJob, controller.createJob);

// PUT /api/jobs/:id      — admin only
router.put('/:id', requireAuth, requireRole('admin'), validateJob, controller.updateJob);

// DELETE /api/jobs/:id   — admin only
router.delete('/:id', requireAuth, requireRole('admin'), controller.deleteJob);

// POST /api/jobs/:jobId/apply  — authenticated users (non-admin) only
router.post('/:jobId/apply', requireAuth, requireRole('user'), appCtrl.applyForJob);

module.exports = router;
