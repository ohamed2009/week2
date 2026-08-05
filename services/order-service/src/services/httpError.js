// Translates an axios error from a downstream service call into an error that
// carries an HTTP status code for our own response.
//
//   - If the downstream service answered with an error status (404, 409, ...),
//     we propagate that status and its message so the caller sees the real
//     reason.
//   - If there was no response at all (connection refused, DNS failure, or a
//     timeout), the service is effectively down, so we surface a 503.
function toApiError(err, serviceName) {
  if (err.response) {
    const statusCode = err.response.status;
    const message =
      (err.response.data && err.response.data.message) ||
      `${serviceName} responded with ${statusCode}`;
    const apiError = new Error(message);
    apiError.statusCode = statusCode;
    return apiError;
  }

  const apiError = new Error(`${serviceName} is unavailable`);
  apiError.statusCode = 503;
  return apiError;
}

module.exports = { toApiError };
