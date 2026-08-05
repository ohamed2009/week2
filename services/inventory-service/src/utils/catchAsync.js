// catchAsync = a small wrapper for async route handlers.
//
// Problem: in Express 4, if an async function throws (or a promise rejects),
// Express does NOT automatically catch it -> the request hangs or the server
// can crash. The spec asks us to "wrap route handlers in try/catch".
//
// Instead of writing try/catch in EVERY controller, we wrap each handler once.
// If the promise rejects, we forward the error to Express via next(err), which
// sends it to our central errorHandler. Clean and DRY (Don't Repeat Yourself).
//
// Usage:  router.post('/', catchAsync(controller.createStock))
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
