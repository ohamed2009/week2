// app.js = builds the Express application (middleware + routes + error handling).
// It does NOT start listening — that's server.js's job. Keeping them separate
// makes the app importable in tests without opening a real port.

const express = require('express');
const inventoryRoutes = require('./routes/inventory.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Built-in middleware: parse incoming JSON bodies into req.body.
app.use(express.json());

// Health check. The spec requires GET /health -> { status: "ok" } on EVERY
// service; next week's gateway will poll this to know the service is alive.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount all inventory routes under /inventory.
app.use('/inventory', inventoryRoutes);

// Anything that didn't match a route above -> 404 in our standard json shape.
app.use(notFound);

// Central error handler. MUST be registered last (after routes) so it can
// catch errors forwarded from all of them.
app.use(errorHandler);

module.exports = app;
