const express = require("express");
const userRoutes = require("./routes/user.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/users", userRoutes);

// 404 for anything not matched above
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
});

// Must be registered last: catches errors from asyncHandler-wrapped routes
app.use(errorHandler);

module.exports = app;
