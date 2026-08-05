// Central error handler middleware. Produces the SAME json error shape every
// service uses (spec Section 5):
//   { "error": true, "message": "...", "statusCode": 404 }
// Express treats a 4-argument function (err, req, res, next) as an error handler.

const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Friendly mapping for common Mongoose errors.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field "${err.path}"`;
  }

  if (!err.isOperational && statusCode === 500) {
    console.error('[UNEXPECTED ERROR]', err);
  }

  res.status(statusCode).json({ error: true, message, statusCode });
}

// 404 handler for unknown routes.
function notFound(req, res) {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

module.exports = { errorHandler, notFound, AppError };
