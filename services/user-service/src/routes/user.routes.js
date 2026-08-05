const express = require("express");
const { register, login, getUserById } = require("../controllers/user.controller");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/:id", asyncHandler(getUserById));

module.exports = router;
