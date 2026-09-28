'use strict';

/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
function sendSuccess(res, statusCode = 200, message = 'Success', data = null) {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string|null} error  Human-readable detail — never a stack trace.
 */
function sendError(res, statusCode = 500, message = 'An error occurred', error = null) {
  const body = { success: false, message };
  if (error) body.error = error;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
