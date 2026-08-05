// Stock model = the Mongoose schema for one product's stock level.
//
// Spec (Section 4.3): Stock model has productId, quantity (Number), updatedAt.
// The schema is the "shape contract" Mongoose enforces before saving to MongoDB.

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    // productId comes from catalog-service. One stock row per product, so unique.
    productId: {
      type: String,
      required: [true, 'productId is required'],
      unique: true,
      trim: true,
    },

    // How many units are currently available. Must never go below 0.
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
      min: [0, 'quantity cannot be negative'],
      default: 0,
    },
  },
  {
    // timestamps:true auto-adds createdAt + updatedAt and keeps updatedAt fresh
    // on every save/update. The spec wants updatedAt -> this gives it for free.
    timestamps: true,
  }
);

// mongoose.model(name, schema) compiles the schema into a usable Model.
// "Stock" -> Mongoose stores docs in the "stocks" collection (lowercase plural).
module.exports = mongoose.model('Stock', stockSchema);
