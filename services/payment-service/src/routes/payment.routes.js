const express = require('express');

const { createPayment, getPayment } = require('../controllers/payment.controller');

const router = express.Router();

// POST /payments  -> simulate a charge for an order
router.post('/', createPayment);

// GET /payments/:id -> fetch a single payment record
router.get('/:id', getPayment);

module.exports = router;
