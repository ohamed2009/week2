const express = require('express');
const cors = require('cors');

const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Liveness probe. Next week's gateway polls this to know the service is up.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/orders', orderRoutes);

// Unknown route -> consistent 404 in the shared error shape.
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
});

// Central error handler. Errors bubbling up from the orchestration flow (a
// downstream 404/409, a payment failure translated to 402, an unreachable
// service translated to 503) are all serialized here in the shared shape.
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
