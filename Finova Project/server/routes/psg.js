const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { verifyReportsPin } = require('../middleware/pinAuth');
const {
  getPSGReports,
  getPSGOrderHistory,
  getPSGItemDetails
} = require('../controllers/psgController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes (PIN protected)
router.get('/reports', verifyReportsPin, getPSGReports);
router.get('/orders', verifyReportsPin, getPSGOrderHistory);
router.get('/items/:itemId', verifyReportsPin, getPSGItemDetails);

module.exports = router;
