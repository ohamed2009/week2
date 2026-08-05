const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/", asyncHandler(createProduct));
router.get("/", asyncHandler(getAllProducts));
router.get("/:id", asyncHandler(getProductById));
router.put("/:id", asyncHandler(updateProduct));
router.delete("/:id", asyncHandler(deleteProduct));

module.exports = router;
