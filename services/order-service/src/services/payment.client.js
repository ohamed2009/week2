const axios = require('axios');

const { toApiError } = require('./httpError');

const BASE_URL = process.env.PAYMENT_SERVICE_URL;
const TIMEOUT = 5000;

// POST /payments on payment-service. Charges the given amount for an order.
// The controller treats any failure here as a payment failure and rolls the
// stock reservation back.
async function charge(orderId, userId, amount) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/payments`,
      { orderId, userId, amount },
      { timeout: TIMEOUT }
    );
    return data;
  } catch (err) {
    throw toApiError(err, 'payment-service');
  }
}

module.exports = { charge };
