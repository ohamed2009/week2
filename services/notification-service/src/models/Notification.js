// Notification model = one stored notification.
// Spec (Section 4.5): Notification model has userId, orderId, message, createdAt.

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Which user this notification is for (comes from user-service).
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    // Which order triggered it (comes from order-service).
    orderId: {
      type: String,
      required: [true, 'orderId is required'],
      trim: true,
    },

    // The human-readable text ("Your order #123 is confirmed").
    message: {
      type: String,
      required: [true, 'message is required'],
      trim: true,
    },
  },
  {
    // Adds createdAt + updatedAt automatically. Spec wants createdAt.
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
