const axios = require('axios');

const { toApiError } = require('./httpError');

const BASE_URL = process.env.NOTIFICATION_SERVICE_URL;
const TIMEOUT = 5000;

// POST /notifications on notification-service. This call is best-effort: the
// controller never lets a failure here fail the whole order, it just logs it.
async function sendNotification(userId, orderId, message) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/notifications`,
      { userId, orderId, message },
      { timeout: TIMEOUT }
    );
    return data;
  } catch (err) {
    throw toApiError(err, 'notification-service');
  }
}

module.exports = { sendNotification };
