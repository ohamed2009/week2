const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const crypto = require("crypto");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// 1. CORS
app.use(cors());

// 2. Request ID
app.use((req, res, next) => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = crypto.randomUUID();
  }
  next();
});

// 3. Request Logging
morgan.token('id', req => req.headers['x-request-id']);
app.use(morgan(':method :url :status :response-time ms - :id'));

// Downstream URLs from .env
const services = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  products: process.env.CATALOG_SERVICE_URL || 'http://localhost:4002',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4004',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4005',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
};

// 4. Aggregated /api/health
app.get("/api/health", async (req, res) => {
  const statusMap = {};
  
  const healthCheck = async (name, url, serviceName) => {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        statusMap[serviceName] = "ok";
      } else {
        statusMap[serviceName] = "down";
      }
    } catch (err) {
      statusMap[serviceName] = "down";
    }
  };

  const promises = [
    healthCheck("users", services.users, "user-service"),
    healthCheck("products", services.products, "catalog-service"),
    healthCheck("orders", services.orders, "order-service"),
    healthCheck("inventory", services.inventory, "inventory-service"),
    healthCheck("payments", services.payments, "payment-service"),
    healthCheck("notifications", services.notifications, "notification-service"),
  ];

  await Promise.all(promises);
  res.json(statusMap);
});

// Error passthrough handler for proxies
const onProxyError = (err, req, res) => {
  res.status(503).json({
    error: true,
    message: err.message,
    statusCode: 503
  });
};

// 5. Proxy configuration
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', 
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
  }
});

app.use('/api/users', createProxyMiddleware(proxyOptions(services.users)));
app.use('/api/products', createProxyMiddleware(proxyOptions(services.products)));
app.use('/api/orders', createProxyMiddleware(proxyOptions(services.orders)));
app.use('/api/inventory', createProxyMiddleware(proxyOptions(services.inventory)));
app.use('/api/payments', createProxyMiddleware(proxyOptions(services.payments)));
app.use('/api/notifications', createProxyMiddleware(proxyOptions(services.notifications)));

// Fallback 404
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404
  });
});

module.exports = app;
