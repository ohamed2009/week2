// orderConfirmed.handler.js = what to do with an "order.confirmed" event
// consumed from RabbitMQ.
//
// Deliberately mirrors notification.controller.js's createNotification: same
// validation, same Notification document, same "mock send" log line. The
// only difference is where the {userId, orderId, message} came from (a
// RabbitMQ message instead of an HTTP request body).

const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

async function handleOrderConfirmed(payload) {
  const { userId, orderId, message } = payload || {};

  // Same validation as POST /notifications. Throwing here means the
  // RabbitMQ consumer (rabbitmq.js) will nack-without-requeue the message —
  // a malformed event will never become valid on retry, so it's dropped
  // rather than redelivered forever.
  if (!userId) throw new AppError('userId is required', 400);
  if (!orderId) throw new AppError('orderId is required', 400);
  if (!message) throw new AppError('message is required', 400);

  const notification = await Notification.create({ userId, orderId, message });

  // "Send" it (mock), same as the HTTP path.
  console.log(`[NOTIFY] (via RabbitMQ) -> user=${userId} order=${orderId} : "${message}"`);

  return notification;
}

module.exports = handleOrderConfirmed;
