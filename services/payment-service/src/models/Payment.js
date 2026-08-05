const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
