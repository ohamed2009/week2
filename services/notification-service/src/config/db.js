// db.js = opens the MongoDB connection with Mongoose, reading MONGO_URI from .env.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is missing. Did you create a .env file?');
  }

  await mongoose.connect(uri);
  console.log('[notification-service] MongoDB connected');
}

module.exports = connectDB;
