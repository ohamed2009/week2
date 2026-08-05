const express = require('express');

const {
  createOrder,
  getOrder,
  getOrdersByUser,
} = require('../controllers/order.controller');

const router = express.Router();

// POST /orders -> run the full checkout orchestration
router.post('/', createOrder);

// GET /orders/user/:userId -> list a user's orders (declared before /:id so
// "user" is not captured as an order id)
router.get('/user/:userId', getOrdersByUser);

// GET /orders/:id -> a single order with its final status and event log
router.get('/:id', getOrder);

module.exports = router;
