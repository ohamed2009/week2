const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Liveness probe. Next week's gateway polls this to know the service is up.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/payments', paymentRoutes);

// Unknown route -> consistent 404 in the shared error shape.
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
});

// Central error handler. Every thrown/forwarded error ends up here and is
// serialized in the same JSON shape used across all services.
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: true, message, statusCode });
});

module.exports = app;
