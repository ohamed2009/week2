// catchAsync = wraps an async route handler so that if its promise rejects,
// the error is forwarded to Express (next(err)) instead of crashing/hanging.
// Saves us writing try/catch in every controller.
//
// Usage:  router.post('/', catchAsync(controller.createNotification))
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
