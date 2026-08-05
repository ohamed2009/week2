const mongoose = require('mongoose');

// Open the Mongoose connection. We exit the process on failure so a bad
// configuration surfaces immediately instead of the service running half-broken.
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
