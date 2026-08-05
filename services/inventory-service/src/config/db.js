// db.js = the single place that opens the MongoDB connection with Mongoose.
//
// We read the connection string from process.env.MONGO_URI (loaded from .env by
// dotenv in server.js). Never hardcode the URI here -> the spec requires all
// config to come from .env so switching between local Mongo and Atlas is just
// an env change, not a code change.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // Fail fast with a clear message instead of a cryptic error later.
    throw new Error('MONGO_URI is missing. Did you create a .env file?');
  }

  // mongoose.connect returns a promise; we await it so the server only starts
  // AFTER the DB is connected.
  await mongoose.connect(uri);
  console.log('[inventory-service] MongoDB connected');
}

module.exports = connectDB;
