'use strict';

const appService             = require('../services/application.service');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/jobs/:jobId/apply
function applyForJob(req, res, next) {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) return sendError(res, 400, 'Invalid job ID.');

    const application = appService.applyForJob(req.user.id, jobId);
    return sendSuccess(res, 201, 'Application submitted successfully.', { application });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// GET /api/applications/my
function getMyApplications(req, res, next) {
  try {
    const applications = appService.getMyApplications(req.user.id);
    return sendSuccess(res, 200, 'Applications retrieved successfully.', { applications });
  } catch (err) {
    next(err);
  }
}

// GET /api/applications/:id
function getApplicationById(req, res, next) {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) return sendError(res, 400, 'Invalid application ID.');

    // Users can only see their own applications; admins can see all
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const application = appService.getApplicationById(appId, userId);
    return sendSuccess(res, 200, 'Application retrieved successfully.', { application });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

module.exports = { applyForJob, getMyApplications, getApplicationById };
