// inventory.controller.js = the actual business logic for each endpoint.
// Routes call these functions. Each throws AppError on failure; catchAsync
// forwards it to the central error handler.

const Stock = require('../models/Stock');
const AppError = require('../utils/AppError');

// Small helper: make sure a body field exists and is a valid quantity (>= 0).
// Missing/invalid input -> 400 (spec: "missing fields -> 400").
function requirePositiveQuantity(quantity) {
  if (quantity === undefined || quantity === null) {
    throw new AppError('quantity is required', 400);
  }
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity < 0) {
    throw new AppError('quantity must be a number >= 0', 400);
  }
}

// POST /inventory
// Set (or reset) the initial stock for a product. { productId, quantity }
// Uses upsert: if the product has no stock row yet, create it; otherwise update.
exports.setStock = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) throw new AppError('productId is required', 400);
  requirePositiveQuantity(quantity);

  const stock = await Stock.findOneAndUpdate(
    { productId },
    { $set: { quantity } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(stock);
};

// GET /inventory/:productId
// Return the current stock for one product. 404 if we have no row for it.
exports.getStock = async (req, res) => {
  const { productId } = req.params;

  const stock = await Stock.findOne({ productId });
  if (!stock) throw new AppError('Product not found in inventory', 404);

  res.status(200).json(stock);
};

// POST /inventory/reserve
// { productId, quantity } -> decrement stock. Returns 409 if not enough.
//
// IMPORTANT (race safety): we do the check-and-decrement in ONE atomic query.
// The filter "quantity: { $gte: quantity }" means MongoDB only decrements when
// there is enough stock. This prevents two orders from both reserving the last
// item (a classic race condition).
exports.reserveStock = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) throw new AppError('productId is required', 400);
  requirePositiveQuantity(quantity);

  const stock = await Stock.findOneAndUpdate(
    { productId, quantity: { $gte: quantity } }, // only match if enough stock
    { $inc: { quantity: -quantity } }, // atomic decrement
    { new: true }
  );

  if (!stock) {
    // The update matched nothing. Two possible reasons -> give the right code.
    const exists = await Stock.findOne({ productId });
    if (!exists) throw new AppError('Product not found in inventory', 404);
    throw new AppError('Insufficient stock', 409); // spec: 409 on conflict
  }

  res.status(200).json({
    message: 'Stock reserved',
    productId: stock.productId,
    reserved: quantity,
    remaining: stock.quantity,
  });
};

// POST /inventory/release
// { productId, quantity } -> increment stock back. Used when an order fails
// AFTER stock was reserved (rollback / compensating action).
exports.releaseStock = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) throw new AppError('productId is required', 400);
  requirePositiveQuantity(quantity);

  const stock = await Stock.findOneAndUpdate(
    { productId },
    { $inc: { quantity: quantity } }, // atomic increment (give it back)
    { new: true }
  );

  if (!stock) throw new AppError('Product not found in inventory', 404);

  res.status(200).json({
    message: 'Stock released',
    productId: stock.productId,
    released: quantity,
    available: stock.quantity,
  });
};
