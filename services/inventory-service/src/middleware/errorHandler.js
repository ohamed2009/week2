// Central error handler middleware.
//
// Any error thrown/forwarded anywhere ends up here (thanks to catchAsync).
// The bootcamp spec (Section 5) requires EVERY service to answer failures with
// the SAME json shape, so a gateway or another service can parse errors the
// same way everywhere:
//
//   { "error": true, "message": "Product not found", "statusCode": 404 }
//
// Express recognizes this as an error handler because it has 4 arguments
// (err, req, res, next). That 4-arg signature is the required convention.

const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // If it's an error we threw on purpose (AppError), trust its statusCode.
  // Otherwise it's an unexpected bug -> 500, and we don't leak internals.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle a couple of common Mongoose errors with friendlier codes:
  if (err.name === 'ValidationError') {
    statusCode = 400; // required field missing / wrong type
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'CastError') {
    statusCode = 400; // e.g. an id in the wrong format
    message = `Invalid value for field "${err.path}"`;
  }

  // Log unexpected (non-operational) errors so we can debug them.
  if (!err.isOperational && statusCode === 500) {
    console.error('[UNEXPECTED ERROR]', err);
  }

  res.status(statusCode).json({
    error: true,
    message,
    statusCode,
  });
}

// 404 handler for unknown routes -> keeps the same json shape.
function notFound(req, res) {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

module.exports = { errorHandler, notFound, AppError };
