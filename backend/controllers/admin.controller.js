'use strict';

const appService             = require('../services/application.service');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/admin/dashboard
function getDashboard(req, res, next) {
  try {
    const stats = appService.getAdminStats();
    return sendSuccess(res, 200, 'Dashboard data retrieved.', stats);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/jobs/:jobId/applications
function getJobApplications(req, res, next) {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) return sendError(res, 400, 'Invalid job ID.');

    const applications = appService.getApplicationsForJob(jobId);
    return sendSuccess(res, 200, 'Applications retrieved.', { applications });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// GET /api/admin/applications
function getAllApplications(req, res, next) {
  try {
    const applications = appService.getAllApplications();
    return sendSuccess(res, 200, 'All applications retrieved.', { applications });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/applications/:id/status
function updateApplicationStatus(req, res, next) {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) return sendError(res, 400, 'Invalid application ID.');

    const application = appService.updateApplicationStatus(appId, req.body.status);
    return sendSuccess(res, 200, 'Application status updated.', { application });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

module.exports = { getDashboard, getJobApplications, getAllApplications, updateApplicationStatus };
