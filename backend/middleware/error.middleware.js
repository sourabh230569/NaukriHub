'use strict';

/**
 * Global Express error handler.
 * Catches errors passed via next(err) anywhere in the stack.
 * Never exposes stack traces to clients.
 */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Log server-side for debugging (only in dev so we see the trace)
  if (isDev) {
    console.error('[ErrorHandler]', err);
  } else {
    console.error('[ErrorHandler]', err.message);
  }

  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, message: 'Request blocked by CORS policy.' });
  }

  const statusCode = typeof err.status === 'number' ? err.status : 500;
  const message    = err.message || 'An unexpected error occurred.';

  // Never leak stack traces or internal db details to the client
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal server error.' : message,
    ...(isDev && statusCode >= 500 ? { debug: err.message } : {})
  });
}

/**
 * 404 handler — place after all routes.
 */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
}

module.exports = { errorHandler, notFound };
