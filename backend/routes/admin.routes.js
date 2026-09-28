'use strict';

const router     = require('express').Router();
const controller = require('../controllers/admin.controller');
const { requireAuth }        = require('../middleware/auth.middleware');
const { requireRole }        = require('../middleware/role.middleware');
const { validateStatusUpdate } = require('../middleware/validation.middleware');

// All admin routes require authentication + admin role
router.use(requireAuth, requireRole('admin'));

// GET  /api/admin/dashboard
router.get('/dashboard', controller.getDashboard);

// GET  /api/admin/jobs/:jobId/applications
router.get('/jobs/:jobId/applications', controller.getJobApplications);

// GET  /api/admin/applications
router.get('/applications', controller.getAllApplications);

// PUT  /api/admin/applications/:id/status
router.put('/applications/:id/status', validateStatusUpdate, controller.updateApplicationStatus);

module.exports = router;
