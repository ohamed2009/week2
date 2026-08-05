// notification.controller.js = business logic for the notification endpoints.

const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

// POST /notifications
// { userId, orderId, message } -> store in DB + log to console.
// The console.log simulates actually sending an email/SMS (mocked, per spec).
exports.createNotification = async (req, res) => {
  const { userId, orderId, message } = req.body;

  // Input validation: all three fields required -> 400 if any is missing.
  if (!userId) throw new AppError('userId is required', 400);
  if (!orderId) throw new AppError('orderId is required', 400);
  if (!message) throw new AppError('message is required', 400);

  const notification = await Notification.create({ userId, orderId, message });

  // "Send" it (mock). In real life this would call an email/SMS provider.
  console.log(
    `[NOTIFY] -> user=${userId} order=${orderId} : "${message}"`
  );

  res.status(201).json(notification);
};

// GET /notifications/:userId
// List all notifications for one user, newest first.
exports.getUserNotifications = async (req, res) => {
  const { userId } = req.params;

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

  // Returning an empty array (not a 404) is correct here: "this user simply has
  // no notifications yet" is a valid, successful answer.
  res.status(200).json(notifications);
};
