// AppError = a custom Error class that also carries an HTTP status code.
//
// Normal JS "throw new Error('...')" only has a message. But in an API we also
// need to know WHICH http status to send back (404? 409? 400?). So we extend
// Error and attach a statusCode. When we throw one of these anywhere in the
// code, our central error handler (middleware/errorHandler.js) reads statusCode
// and builds the standard JSON error response.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // sets this.message
    this.statusCode = statusCode; // e.g. 404, 409, 400
    this.isOperational = true; // marks "expected" errors (bad input, not found)
                               // vs unexpected bugs. Helps the handler decide.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
