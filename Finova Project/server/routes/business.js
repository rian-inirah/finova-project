const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  getBusinessDetails,
  createOrUpdateBusinessDetails,
  setReportsPin,
  businessValidation,
  pinValidation
} = require('../controllers/businessController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', getBusinessDetails);
router.post('/', uploadSingle('businessLogo'), businessValidation, createOrUpdateBusinessDetails);
router.post('/pin', pinValidation, setReportsPin);

module.exports = router;
