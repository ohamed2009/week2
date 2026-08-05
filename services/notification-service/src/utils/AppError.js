// AppError = a custom Error class that also carries an HTTP status code.
// (Same helper used across all services so error handling is identical everywhere.)
//
// Normal JS "throw new Error('...')" only has a message. In an API we also need
// to know WHICH http status to send back (404? 400?). So we extend Error and
// attach a statusCode. Our central error handler reads it to build the response.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // sets this.message
    this.statusCode = statusCode; // e.g. 404, 400
    this.isOperational = true; // "expected" error (bad input / not found) vs bug
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
