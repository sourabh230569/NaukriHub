'use strict';

const { getDb } = require('../config/database');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a dynamic WHERE clause + params array from filter options.
 * Supports: search (title/company), location, employment_type, status.
 */
function buildJobFilters(query) {
  const conditions = [];
  const params     = [];

  if (query.search) {
    conditions.push('(LOWER(j.title) LIKE ? OR LOWER(j.company) LIKE ?)');
    const term = `%${query.search.toLowerCase()}%`;
    params.push(term, term);
  }

  if (query.location) {
    conditions.push('LOWER(j.location) LIKE ?');
    params.push(`%${query.location.toLowerCase()}%`);
  }

  if (query.type) {
    conditions.push('j.employment_type = ?');
    params.push(query.type);
  }

  if (query.status) {
    conditions.push('j.status = ?');
    params.push(query.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * List jobs with optional filtering, search, and sorting.
 * Public endpoint — no auth needed.
 */
function listJobs(query = {}) {
  const db = getDb();
  const { where, params } = buildJobFilters(query);

  // Allowed sort columns (whitelist to prevent SQL injection)
  const sortMap = {
    newest:   'j.created_at DESC',
    oldest:   'j.created_at ASC',
    title:    'j.title ASC',
    company:  'j.company ASC',
    deadline: 'j.application_deadline ASC'
  };
  const orderBy = sortMap[query.sort] || 'j.created_at DESC';

  const sql = `
    SELECT
      j.*,
      u.name   AS created_by_name,
      COUNT(a.id) AS application_count
    FROM jobs j
    LEFT JOIN users        u ON u.id = j.created_by
    LEFT JOIN applications a ON a.job_id = j.id
    ${where}
    GROUP BY j.id
    ORDER BY ${orderBy}
  `;

  return db.prepare(sql).all(...params);
}

/**
 * Get a single job by id, including application count.
 */
function getJobById(jobId) {
  const db  = getDb();
  const job = db.prepare(`
    SELECT
      j.*,
      u.name AS created_by_name,
      COUNT(a.id) AS application_count
    FROM jobs j
    LEFT JOIN users        u ON u.id = j.created_by
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE j.id = ?
    GROUP BY j.id
  `).get(jobId);

  if (!job) {
    const err = new Error('Job not found.');
    err.status = 404;
    throw err;
  }
  return job;
}

/**
 * Create a new job.  Only admins call this.
 */
function createJob(data, adminId) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO jobs
      (title, company, location, employment_type, description, requirements,
       salary, experience, application_deadline, status, created_by)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title.trim(),
    data.company.trim(),
    data.location.trim(),
    data.employment_type,
    data.description.trim(),
    data.requirements.trim(),
    data.salary   ? data.salary.trim()   : null,
    data.experience ? data.experience.trim() : null,
    data.application_deadline,
    data.status && ['Open','Closed'].includes(data.status) ? data.status : 'Open',
    adminId
  );

  return getJobById(result.lastInsertRowid);
}

/**
 * Update an existing job.  Only admins call this.
 */
function updateJob(jobId, data) {
  const db = getDb();

  // Confirm job exists
  const existing = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!existing) {
    const err = new Error('Job not found.');
    err.status = 404;
    throw err;
  }

  const stmt = db.prepare(`
    UPDATE jobs SET
      title                = ?,
      company              = ?,
      location             = ?,
      employment_type      = ?,
      description          = ?,
      requirements         = ?,
      salary               = ?,
      experience           = ?,
      application_deadline = ?,
      status               = ?,
      updated_at           = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.title.trim(),
    data.company.trim(),
    data.location.trim(),
    data.employment_type,
    data.description.trim(),
    data.requirements.trim(),
    data.salary   ? data.salary.trim()   : null,
    data.experience ? data.experience.trim() : null,
    data.application_deadline,
    data.status && ['Open','Closed'].includes(data.status) ? data.status : 'Open',
    jobId
  );

  return getJobById(jobId);
}

/**
 * Delete a job and cascade its applications (FK cascade handles DB side).
 */
function deleteJob(jobId) {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!existing) {
    const err = new Error('Job not found.');
    err.status = 404;
    throw err;
  }

  db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
  return { deleted: true };
}

/**
 * Check whether a specific user has already applied to a job.
 */
function hasUserApplied(userId, jobId) {
  const db  = getDb();
  const row = db.prepare(
    'SELECT id FROM applications WHERE user_id = ? AND job_id = ?'
  ).get(userId, jobId);
  return !!row;
}

module.exports = { listJobs, getJobById, createJob, updateJob, deleteJob, hasUserApplied };
