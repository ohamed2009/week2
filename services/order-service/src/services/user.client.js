const axios = require('axios');

const { toApiError } = require('./httpError');

const BASE_URL = process.env.USER_SERVICE_URL;
const TIMEOUT = 5000;

// GET /users/:id on user-service. Used to verify the buyer exists before an
// order is created. A 404 from user-service propagates as a 404.
async function getUser(userId) {
  try {
    const { data } = await axios.get(`${BASE_URL}/users/${userId}`, {
      timeout: TIMEOUT,
    });
    return data;
  } catch (err) {
    throw toApiError(err, 'user-service');
  }
}

module.exports = { getUser };
