const Product = require("../models/Product");
const AppError = require("../utils/AppError");

// POST /products
async function createProduct(req, res) {
  const { name, description, price } = req.body;

  if (!name || price === undefined) {
    throw new AppError("name and price are required", 400);
  }

  if (typeof price !== "number" || price < 0) {
    throw new AppError("price must be a positive number", 400);
  }

  const product = await Product.create({ name, description, price });

  res.status(201).json(product);
}

// GET /products
async function getAllProducts(req, res) {
  const products = await Product.find();
  res.status(200).json(products);
}

// GET /products/:id
async function getProductById(req, res) {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json(product);
}

// PUT /products/:id
async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, price } = req.body;

  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    throw new AppError("price must be a positive number", 400);
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { name, description, price },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json(product);
}

// DELETE /products/:id
async function deleteProduct(req, res) {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({ message: "Product deleted", id });
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
