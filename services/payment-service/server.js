require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4004;

// Connect to Mongo first, then start accepting traffic.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`payment-service listening on port ${PORT}`);
  });
});
