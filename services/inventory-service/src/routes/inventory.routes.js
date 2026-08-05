// inventory.routes.js = maps HTTP method + path -> controller function.
// This is just the "table of contents" of the API. Logic lives in the controller.

const express = require('express');
const catchAsync = require('../utils/catchAsync');
const controller = require('../controllers/inventory.controller');

const router = express.Router();

// Order matters a little: specific paths before dynamic ":param" ones so that
// e.g. "/reserve" is not accidentally read as a :productId.
router.post('/reserve', catchAsync(controller.reserveStock));
router.post('/release', catchAsync(controller.releaseStock));

router.post('/', catchAsync(controller.setStock)); // POST /inventory
router.get('/:productId', catchAsync(controller.getStock)); // GET /inventory/:productId

module.exports = router;
