'use strict';

const { getDb } = require('../config/database');

// ─── Shared query fragments ───────────────────────────────────────────────────

const APPLICATION_SELECT = `
  SELECT
    a.id,
    a.user_id,
    a.job_id,
    a.status,
    a.applied_at,
    a.updated_at,
    u.name  AS applicant_name,
    u.email AS applicant_email,
    j.title       AS job_title,
    j.company     AS job_company,
    j.location    AS job_location,
    j.employment_type AS job_employment_type,
    j.status      AS job_status,
    j.application_deadline AS job_deadline
  FROM applications a
  JOIN users u ON u.id = a.user_id
  JOIN jobs  j ON j.id = a.job_id
`;

// ─── User-facing operations ───────────────────────────────────────────────────

/**
 * Apply for a job.
 * Validates: job exists, job is open, deadline not passed, not already applied.
 */
function applyForJob(userId, jobId) {
  const db = getDb();

  // Fetch job
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) {
    const err = new Error('Job not found.');
    err.status = 404;
    throw err;
  }

  if (job.status !== 'Open') {
    const err = new Error('Applications for this job are closed.');
    err.status = 400;
    throw err;
  }

  const now      = new Date();
  const deadline = new Date(job.application_deadline);
  if (deadline < now) {
    const err = new Error('The application deadline for this job has passed.');
    err.status = 400;
    throw err;
  }

  // Duplicate-application guard (DB unique constraint also enforces this)
  const existing = db.prepare(
    'SELECT id FROM applications WHERE user_id = ? AND job_id = ?'
  ).get(userId, jobId);
  if (existing) {
    const err = new Error('You have already applied for this job.');
    err.status = 409;
    throw err;
  }

  const result = db.prepare(
    `INSERT INTO applications (user_id, job_id, status) VALUES (?, ?, 'Applied')`
  ).run(userId, jobId);

  return getApplicationById(result.lastInsertRowid, userId);
}

/**
 * Get all applications for the currently logged-in user.
 */
function getMyApplications(userId) {
  const db = getDb();
  return db.prepare(`${APPLICATION_SELECT} WHERE a.user_id = ? ORDER BY a.applied_at DESC`).all(userId);
}

/**
 * Get a single application by id.
 * Optionally restricts to a specific user (for user-role access checks).
 */
function getApplicationById(appId, userId = null) {
  const db = getDb();

  let sql    = `${APPLICATION_SELECT} WHERE a.id = ?`;
  const args = [appId];

  if (userId !== null) {
    sql += ' AND a.user_id = ?';
    args.push(userId);
  }

  const app = db.prepare(sql).get(...args);
  if (!app) {
    const err = new Error('Application not found.');
    err.status = 404;
    throw err;
  }
  return app;
}

// ─── Admin-facing operations ──────────────────────────────────────────────────

/**
 * Get all applications for a specific job (admin).
 */
function getApplicationsForJob(jobId) {
  const db = getDb();

  // Confirm job exists
  const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!job) {
    const err = new Error('Job not found.');
    err.status = 404;
    throw err;
  }

  return db.prepare(
    `${APPLICATION_SELECT} WHERE a.job_id = ? ORDER BY a.applied_at DESC`
  ).all(jobId);
}

/**
 * Get every application in the system (admin overview).
 */
function getAllApplications() {
  const db = getDb();
  return db.prepare(`${APPLICATION_SELECT} ORDER BY a.applied_at DESC`).all();
}

/**
 * Update application status (admin).
 */
function updateApplicationStatus(appId, newStatus) {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
  if (!existing) {
    const err = new Error('Application not found.');
    err.status = 404;
    throw err;
  }

  db.prepare(
    `UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(newStatus, appId);

  return getApplicationById(appId);
}

// ─── Dashboard aggregates ─────────────────────────────────────────────────────

/**
 * Admin dashboard statistics.
 */
function getAdminStats() {
  const db = getDb();

  const jobStats = db.prepare(`
    SELECT
      COUNT(*)                                  AS total_jobs,
      SUM(CASE WHEN status = 'Open'   THEN 1 ELSE 0 END) AS open_jobs,
      SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed_jobs
    FROM jobs
  `).get();

  const appStats = db.prepare(`
    SELECT COUNT(*) AS total_applications FROM applications
  `).get();

  const appsByJob = db.prepare(`
    SELECT
      j.id,
      j.title,
      j.company,
      j.location,
      j.employment_type,
      j.status,
      j.application_deadline,
      j.created_at,
      COUNT(a.id) AS application_count
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `).all();

  return {
    total_jobs:         jobStats.total_jobs,
    open_jobs:          jobStats.open_jobs,
    closed_jobs:        jobStats.closed_jobs,
    total_applications: appStats.total_applications,
    jobs:               appsByJob
  };
}

/**
 * User dashboard statistics.
 */
function getUserStats(userId) {
  const db = getDb();

  const totals = db.prepare(`
    SELECT
      COUNT(*) AS total_applications,
      SUM(CASE WHEN status = 'Applied'       THEN 1 ELSE 0 END) AS applied,
      SUM(CASE WHEN status = 'Under Review'  THEN 1 ELSE 0 END) AS under_review,
      SUM(CASE WHEN status = 'Shortlisted'   THEN 1 ELSE 0 END) AS shortlisted,
      SUM(CASE WHEN status = 'Selected'      THEN 1 ELSE 0 END) AS selected,
      SUM(CASE WHEN status = 'Rejected'      THEN 1 ELSE 0 END) AS rejected
    FROM applications
    WHERE user_id = ?
  `).get(userId);

  const recent = db.prepare(`
    ${APPLICATION_SELECT}
    WHERE a.user_id = ?
    ORDER BY a.applied_at DESC
    LIMIT 5
  `).all(userId);

  return { ...totals, recent_applications: recent };
}

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationById,
  getApplicationsForJob,
  getAllApplications,
  updateApplicationStatus,
  getAdminStats,
  getUserStats
};
