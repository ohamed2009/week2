const axios = require('axios');

const { toApiError } = require('./httpError');

const BASE_URL = process.env.INVENTORY_SERVICE_URL;
const TIMEOUT = 5000;

// POST /inventory/reserve on inventory-service. Decrements stock for a product.
// Returns a 409 (propagated) when there is not enough stock.
async function reserveStock(productId, quantity) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/inventory/reserve`,
      { productId, quantity },
      { timeout: TIMEOUT }
    );
    return data;
  } catch (err) {
    throw toApiError(err, 'inventory-service');
  }
}

// POST /inventory/release on inventory-service. Puts stock back. Used as the
// compensating action when payment fails after a reservation.
async function releaseStock(productId, quantity) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/inventory/release`,
      { productId, quantity },
      { timeout: TIMEOUT }
    );
    return data;
  } catch (err) {
    throw toApiError(err, 'inventory-service');
  }
}

module.exports = { reserveStock, releaseStock };
