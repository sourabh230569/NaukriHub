'use strict';

const { sendError } = require('../utils/response');

// ─── Field helpers ────────────────────────────────────────────────────────────

const VALID_EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
const VALID_APP_STATUSES     = ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'];
const EMAIL_RE               = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(val) {
  return val === undefined || val === null || String(val).trim() === '';
}

// ─── Registration ─────────────────────────────────────────────────────────────

function validateRegister(req, res, next) {
  const { name, email, password, confirmPassword } = req.body;
  const errors = [];

  if (isBlank(name))            errors.push('Name is required.');
  if (isBlank(email))           errors.push('Email is required.');
  else if (!EMAIL_RE.test(email)) errors.push('Please enter a valid email address.');
  if (isBlank(password))        errors.push('Password is required.');
  else if (password.length < 8) errors.push('Password must be at least 8 characters.');
  if (isBlank(confirmPassword)) errors.push('Please confirm your password.');
  else if (password !== confirmPassword) errors.push('Passwords do not match.');

  if (errors.length) return sendError(res, 400, errors[0], 'Validation failed');
  next();
}

// ─── Login ────────────────────────────────────────────────────────────────────

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (isBlank(email))    errors.push('Email is required.');
  else if (!EMAIL_RE.test(email)) errors.push('Please enter a valid email address.');
  if (isBlank(password)) errors.push('Password is required.');

  if (errors.length) return sendError(res, 400, errors[0], 'Validation failed');
  next();
}

// ─── Job ──────────────────────────────────────────────────────────────────────

function validateJob(req, res, next) {
  const { title, company, location, employment_type, description, requirements, application_deadline } = req.body;
  const errors = [];

  if (isBlank(title))                errors.push('Job title is required.');
  if (isBlank(company))              errors.push('Company name is required.');
  if (isBlank(location))             errors.push('Location is required.');
  if (isBlank(description))          errors.push('Job description is required.');
  if (isBlank(requirements))         errors.push('Job requirements are required.');
  if (isBlank(application_deadline)) errors.push('Application deadline is required.');

  if (isBlank(employment_type)) {
    errors.push('Employment type is required.');
  } else if (!VALID_EMPLOYMENT_TYPES.includes(employment_type)) {
    errors.push(`Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}.`);
  }

  if (!isBlank(application_deadline)) {
    const deadline = new Date(application_deadline);
    if (isNaN(deadline.getTime())) {
      errors.push('Application deadline must be a valid date.');
    }
  }

  if (errors.length) return sendError(res, 400, errors[0], 'Validation failed');
  next();
}

// ─── Application status update ────────────────────────────────────────────────

function validateStatusUpdate(req, res, next) {
  const { status } = req.body;
  if (isBlank(status)) return sendError(res, 400, 'Status is required.', 'Validation failed');
  if (!VALID_APP_STATUSES.includes(status)) {
    return sendError(res, 400, `Status must be one of: ${VALID_APP_STATUSES.join(', ')}.`, 'Validation failed');
  }
  next();
}

module.exports = { validateRegister, validateLogin, validateJob, validateStatusUpdate };
