// notification.routes.js = maps HTTP method + path -> controller function.

const express = require('express');
const catchAsync = require('../utils/catchAsync');
const controller = require('../controllers/notification.controller');

const router = express.Router();

router.post('/', catchAsync(controller.createNotification)); // POST /notifications
router.get('/:userId', catchAsync(controller.getUserNotifications)); // GET /notifications/:userId

module.exports = router;
