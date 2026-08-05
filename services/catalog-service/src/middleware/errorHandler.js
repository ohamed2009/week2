// Ensures every error response matches the standard shape (Section 5):
// { error: true, message: "...", statusCode: ... }
function errorHandler(err, req, res, next) {
  // Mongoose throws a CastError for malformed ObjectIds (e.g. GET /products/abc)
  // Treat that as "not found" rather than a 500.
  if (err.name === "CastError") {
    return res.status(404).json({
      error: true,
      message: "Resource not found",
      statusCode: 404,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Unexpected server error";

  if (statusCode === 500) {
    console.error("[catalog-service] Unexpected error:", err);
  }

  res.status(statusCode).json({
    error: true,
    message,
    statusCode,
  });
}

// Wraps async route handlers so thrown/rejected errors go to errorHandler
// instead of crashing the process.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
