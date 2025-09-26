const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  itemValidation
} = require('../controllers/itemController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', uploadSingle('image'), itemValidation, createItem);
router.put('/:id', uploadSingle('image'), itemValidation, updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
