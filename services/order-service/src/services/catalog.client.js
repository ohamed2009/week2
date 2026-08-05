const axios = require('axios');

const { toApiError } = require('./httpError');

const BASE_URL = process.env.CATALOG_SERVICE_URL;
const TIMEOUT = 5000;

// GET /products/:id on catalog-service. Used to fetch the product name and
// price. A 404 (product does not exist) propagates as a 404.
async function getProduct(productId) {
  try {
    const { data } = await axios.get(`${BASE_URL}/products/${productId}`, {
      timeout: TIMEOUT,
    });
    return data;
  } catch (err) {
    throw toApiError(err, 'catalog-service');
  }
}

module.exports = { getProduct };
