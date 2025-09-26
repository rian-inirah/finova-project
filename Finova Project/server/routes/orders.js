const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  markOrderPrinted,
  orderValidation
} = require('../controllers/orderController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/', orderValidation, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id', orderValidation, updateOrder);
router.delete('/:id', deleteOrder);
router.post('/:id/print', markOrderPrinted);

module.exports = router;
