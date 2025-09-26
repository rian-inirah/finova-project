const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  generateBillPreview,
  generateBillPDFFile,
  shareBillViaEmail,
  getWhatsAppShareLink,
  printBill
} = require('../controllers/billingController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Email validation
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
];

// Routes
router.get('/:id/preview', generateBillPreview);
router.get('/:id/pdf', generateBillPDFFile);
router.post('/:id/email', emailValidation, shareBillViaEmail);
router.get('/:id/whatsapp', getWhatsAppShareLink);
router.post('/:id/print', printBill);

module.exports = router;
