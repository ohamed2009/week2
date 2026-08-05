const mongoose = require('mongoose');

const Payment = require('../models/Payment');

// POST /payments
// Body: { orderId, userId, amount }
// Simulates a charge: always succeeds unless amount <= 0.
async function createPayment(req, res, next) {
  try {
    const { orderId, userId, amount } = req.body;

    // Input validation -> 400 on any missing field.
    if (!orderId || !userId || amount === undefined) {
      const err = new Error('orderId, userId and amount are required');
      err.statusCode = 400;
      throw err;
    }

    // Business rule: a non-positive amount is not a valid charge.
    if (typeof amount !== 'number' || amount <= 0) {
      const err = new Error('amount must be a positive number');
      err.statusCode = 400;
      throw err;
    }

    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      status: 'SUCCESS',
    });

    res.status(201).json({
      paymentId: payment._id,
      status: payment.status,
    });
  } catch (err) {
    next(err);
  }
}

// GET /payments/:id
async function getPayment(req, res, next) {
  try {
    const { id } = req.params;

    // Guard against a malformed id so Mongoose does not throw a CastError.
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('Invalid payment id');
      err.statusCode = 400;
      throw err;
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      throw err;
    }

    res.json(payment);
  } catch (err) {
    next(err);
  }
}

module.exports = { createPayment, getPayment };
