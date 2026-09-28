'use strict';

const jobService             = require('../services/job.service');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/jobs
function listJobs(req, res, next) {
  try {
    const jobs = jobService.listJobs(req.query);
    return sendSuccess(res, 200, 'Jobs retrieved successfully.', { jobs });
  } catch (err) {
    next(err);
  }
}

// GET /api/jobs/:id
function getJob(req, res, next) {
  try {
    const job = jobService.getJobById(parseInt(req.params.id, 10));

    // If a logged-in user is making this request, include whether they've applied
    let hasApplied = false;
    if (req.user && req.user.role === 'user') {
      hasApplied = jobService.hasUserApplied(req.user.id, job.id);
    }

    return sendSuccess(res, 200, 'Job retrieved successfully.', { job, hasApplied });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// POST /api/jobs  (admin only)
function createJob(req, res, next) {
  try {
    const job = jobService.createJob(req.body, req.user.id);
    return sendSuccess(res, 201, 'Job created successfully.', { job });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// PUT /api/jobs/:id  (admin only)
function updateJob(req, res, next) {
  try {
    const job = jobService.updateJob(parseInt(req.params.id, 10), req.body);
    return sendSuccess(res, 200, 'Job updated successfully.', { job });
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

// DELETE /api/jobs/:id  (admin only)
function deleteJob(req, res, next) {
  try {
    jobService.deleteJob(parseInt(req.params.id, 10));
    return sendSuccess(res, 200, 'Job deleted successfully.');
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.message);
    next(err);
  }
}

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob };
