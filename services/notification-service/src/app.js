// app.js = builds the Express application (middleware + routes + error handling).
// server.js is what actually starts listening.

const express = require('express');
const notificationRoutes = require('./routes/notification.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(express.json()); // parse JSON bodies into req.body

// Health check (required on every service; the gateway will poll it next week).
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount notification routes under /notifications.
app.use('/notifications', notificationRoutes);

app.use(notFound); // unknown route -> standard 404 json
app.use(errorHandler); // central error handler (must be last)

module.exports = app;
