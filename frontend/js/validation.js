/**
 * validation.js — client-side form validation helpers.
 * Mirrors server-side validation for immediate feedback.
 * Never replaces server validation — it only speeds up UX.
 */

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

// ─── Field-level validators ───────────────────────────────────────────────────

function isBlank(val) {
  return !val || String(val).trim() === '';
}

function validateEmail(email) {
  if (isBlank(email)) return 'Email is required.';
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  return null;
}

function validatePassword(password) {
  if (isBlank(password)) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

// ─── Form validators ─────────────────────────────────────────────────────────

/**
 * Validate registration form.
 * Returns { valid: bool, errors: { field: message } }
 */
function validateRegisterForm({ name, email, password, confirmPassword }) {
  const errors = {};

  if (isBlank(name))            errors.name = 'Name is required.';
  const emailErr = validateEmail(email);
  if (emailErr)                  errors.email = emailErr;
  const passErr  = validatePassword(password);
  if (passErr)                   errors.password = passErr;
  if (isBlank(confirmPassword))  errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate login form.
 */
function validateLoginForm({ email, password }) {
  const errors = {};
  const emailErr = validateEmail(email);
  if (emailErr)        errors.email = emailErr;
  if (isBlank(password)) errors.password = 'Password is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate job creation / edit form.
 */
function validateJobForm(data) {
  const errors = {};

  if (isBlank(data.title))       errors.title = 'Job title is required.';
  if (isBlank(data.company))     errors.company = 'Company name is required.';
  if (isBlank(data.location))    errors.location = 'Location is required.';
  if (isBlank(data.description)) errors.description = 'Job description is required.';
  if (isBlank(data.requirements))errors.requirements = 'Requirements are required.';

  if (isBlank(data.employment_type)) {
    errors.employment_type = 'Employment type is required.';
  } else if (!VALID_TYPES.includes(data.employment_type)) {
    errors.employment_type = 'Invalid employment type.';
  }

  if (isBlank(data.application_deadline)) {
    errors.application_deadline = 'Application deadline is required.';
  } else {
    const d = new Date(data.application_deadline);
    if (isNaN(d.getTime())) errors.application_deadline = 'Invalid date.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── DOM helpers for showing field errors ────────────────────────────────────

/**
 * Display field-level errors.
 * Expects error spans with id="${fieldId}-error".
 */
function showFieldErrors(errors) {
  // Clear all existing field errors first
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    el.classList.remove('error');
  });

  for (const [field, msg] of Object.entries(errors)) {
    const errorEl = document.getElementById(`${field}-error`);
    const inputEl = document.getElementById(field) ||
                    document.querySelector(`[name="${field}"]`);
    if (errorEl)  errorEl.textContent = msg;
    if (inputEl)  inputEl.classList.add('error');
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error')
    .forEach(el => el.classList.remove('error'));
}

// ─── Expose ──────────────────────────────────────────────────────────────────

window.validate = {
  isBlank,
  validateEmail,
  validatePassword,
  validateRegisterForm,
  validateLoginForm,
  validateJobForm,
  showFieldErrors,
  clearFieldErrors
};
