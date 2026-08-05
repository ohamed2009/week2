require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connectRabbitMQ } = require('./src/config/rabbitmq');

const PORT = process.env.PORT || 4003;

connectDB().then(() => {
  // RabbitMQ is best-effort: a failed connection here is logged but must
  // never stop order-service from listening (see rabbitmq.js).
  connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`order-service listening on port ${PORT}`);
  });
});
