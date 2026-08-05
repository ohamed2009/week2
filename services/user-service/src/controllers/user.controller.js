const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const SALT_ROUNDS = 10;

// POST /users/register
async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError("name, email and password are required", 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    userId: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
}

// POST /users/login
// Note: this issues a simple fake token (not real JWT) per Week 1 scope.
// Week 2 stretch goal is to replace this with a real JWT.
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid email or password", 401);
  }

  // Fake token: not signed, not verifiable — good enough for Week 1 demo flow.
  const token = crypto.randomBytes(24).toString("hex");

  res.status(200).json({
    token,
    userId: user._id,
  });
}

// GET /users/:id
async function getUserById(req, res) {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json(user);
}

module.exports = { register, login, getUserById };
