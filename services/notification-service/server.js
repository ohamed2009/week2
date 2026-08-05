// server.js = entry point: load env, connect to MongoDB, then start listening.

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startConsumer } = require('./src/config/rabbitmq');
const handleOrderConfirmed = require('./src/consumers/orderConfirmed.handler');

const PORT = process.env.PORT || 4006;

async function start() {
  try {
    await connectDB();

    // Fire-and-forget: startConsumer manages its own retry/reconnect loop
    // and never throws, so a RabbitMQ outage must not block HTTP startup —
    // POST /notifications stays available for manual testing either way.
    startConsumer(handleOrderConfirmed);

    app.listen(PORT, () => {
      console.log(`[notification-service] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[notification-service] failed to start:', err.message);
    process.exit(1);
  }
}

start();
