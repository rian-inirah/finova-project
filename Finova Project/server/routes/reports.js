const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { verifyReportsPin } = require('../middleware/pinAuth');
const {
  getOrderReports,
  getItemReports,
  getDailyReports,
  getTopSellingItems
} = require('../controllers/reportsController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes (PIN protected)
router.get('/orders', verifyReportsPin, getOrderReports);
router.get('/items', verifyReportsPin, getItemReports);
router.get('/daily', verifyReportsPin, getDailyReports);
router.get('/top-items', verifyReportsPin, getTopSellingItems);

module.exports = router;
