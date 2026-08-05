// server.js = the entry point. It: loads env vars, connects to MongoDB, then
// starts the HTTP server. We connect to the DB FIRST so the service never
// accepts requests before it can actually read/write data.

require('dotenv').config(); // load .env into process.env (must run first)

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4005;

async function start() {
  try {
    await connectDB(); // won't start listening if this throws
    app.listen(PORT, () => {
      console.log(`[inventory-service] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[inventory-service] failed to start:', err.message);
    process.exit(1); // exit so the host (Render/Railway) can restart cleanly
  }
}

start();
