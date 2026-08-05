// server.js = entry point: load env, connect to MongoDB, then start listening.

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4006;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[notification-service] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[notification-service] failed to start:', err.message);
    process.exit(1);
  }
}

start();
