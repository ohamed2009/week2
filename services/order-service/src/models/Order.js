const mongoose = require('mongoose');

// One entry in the order's internal event log. Every step of the checkout flow
// appends an event here (USER_VERIFIED, STOCK_RESERVED, PAYMENT_SUCCEEDED, ...)
// so the Order document doubles as an audit trail of what happened.
const eventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    payload: { type: Object, default: {} },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING',
  },
  events: { type: [eventSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
