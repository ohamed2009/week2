const mongoose = require('mongoose');

const Order = require('../models/Order');
const userClient = require('../services/user.client');
const catalogClient = require('../services/catalog.client');
const inventoryClient = require('../services/inventory.client');
const paymentClient = require('../services/payment.client');
const notificationClient = require('../services/notification.client');

// Append one entry to the order's internal event log.
function addEvent(order, type, payload = {}) {
  order.events.push({ type, timestamp: new Date(), payload });
}

// POST /orders
// Body: { userId, productId, quantity }
//
// Orchestrates the full checkout by calling every other service in order. Each
// step records an event on the order. If a step fails, the order is saved with
// status FAILED and the failure is returned in the shared error shape.
async function createOrder(req, res, next) {
  const { userId, productId, quantity } = req.body;

  // Input validation -> 400 on missing/invalid fields.
  if (!userId || !productId || quantity === undefined) {
    const err = new Error('userId, productId and quantity are required');
    err.statusCode = 400;
    return next(err);
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    const err = new Error('quantity must be a positive number');
    err.statusCode = 400;
    return next(err);
  }

  // Create the order up front (status PENDING) so we have an id to pass to
  // payment and a document to attach the event log to.
  const order = new Order({ userId, productId, quantity, status: 'PENDING' });

  try {
    // 1. Verify the user exists (404 -> abort with 404).
    await userClient.getUser(userId);
    addEvent(order, 'USER_VERIFIED', { userId });

    // 2. Fetch the product to get its price (404 -> abort with 404).
    const product = await catalogClient.getProduct(productId);
    order.amount = product.price * quantity;
    addEvent(order, 'PRODUCT_FETCHED', { productId, price: product.price });

    // 3. Reserve stock (409 -> abort with 409).
    await inventoryClient.reserveStock(productId, quantity);
    addEvent(order, 'STOCK_RESERVED', { productId, quantity });

    // 4. Charge the payment. On failure, release the reserved stock (the
    //    compensating action) and abort with 402.
    try {
      const payment = await paymentClient.charge(
        order._id.toString(),
        userId,
        order.amount
      );
      addEvent(order, 'PAYMENT_SUCCEEDED', {
        paymentId: payment.paymentId,
        amount: order.amount,
      });
    } catch (paymentErr) {
      addEvent(order, 'PAYMENT_FAILED', { reason: paymentErr.message });

      try {
        await inventoryClient.releaseStock(productId, quantity);
        addEvent(order, 'STOCK_RELEASED', { productId, quantity });
      } catch (releaseErr) {
        // The rollback itself failed; record it but keep the original 402.
        addEvent(order, 'STOCK_RELEASE_FAILED', { reason: releaseErr.message });
      }

      const err = new Error('Payment failed');
      err.statusCode = 402;
      throw err;
    }

    // 5. Notify the user. Best-effort: a failure here never fails the order.
    try {
      await notificationClient.sendNotification(
        userId,
        order._id.toString(),
        `Your order ${order._id} has been confirmed`
      );
      addEvent(order, 'NOTIFICATION_SENT', { userId });
    } catch (notifyErr) {
      console.warn('notification-service call failed:', notifyErr.message);
      addEvent(order, 'NOTIFICATION_SKIPPED', { reason: notifyErr.message });
    }

    // 6. Confirm and persist.
    order.status = 'CONFIRMED';
    addEvent(order, 'ORDER_CONFIRMED', { amount: order.amount });
    await order.save();

    return res.status(201).json(order);
  } catch (err) {
    // Any aborted step lands here: persist the order as FAILED for the record,
    // then forward the error to the central handler.
    order.status = 'FAILED';
    addEvent(order, 'ORDER_FAILED', {
      statusCode: err.statusCode || 500,
      reason: err.message,
    });

    try {
      await order.save();
    } catch (saveErr) {
      console.error('failed to persist FAILED order:', saveErr.message);
    }

    return next(err);
  }
}

// GET /orders/:id
async function getOrder(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('Invalid order id');
      err.statusCode = 400;
      throw err;
    }

    const order = await Order.findById(id);

    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}

// GET /orders/user/:userId
async function getOrdersByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrder, getOrdersByUser };
