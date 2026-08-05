// Custom error class so every thrown error carries a statusCode.
// Works with the error-handling middleware in src/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
