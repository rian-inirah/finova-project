const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../models');

const businessValidation = [
  body('businessCategory')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Business category must be less than 100 characters'),
  body('fssaiNumber')
    .optional()
    .isLength({ max: 20 })
    .withMessage('FSSAI number must be less than 20 characters'),
  body('businessName')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Business name must be less than 200 characters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  body('businessAddress')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Business address must be less than 500 characters'),
  body('gstinNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GSTIN format'),
  body('gstSlab')
    .optional()
    .isInt({ min: 0, max: 28 })
    .withMessage('GST slab must be between 0 and 28'),
  body('gstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST percentage must be between 0 and 100')
];

const pinValidation = [
  body('pin')
    .isLength({ min: 4, max: 4 })
    .isNumeric()
    .withMessage('PIN must be exactly 4 digits')
];

const getBusinessDetails = async (req, res) => {
  try {
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id },
      attributes: { exclude: ['reportsPinHash'] }
    });

    if (!businessDetails) {
      return res.json({ businessDetails: null });
    }

    res.json({ businessDetails });
  } catch (error) {
    console.error('Get business details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createOrUpdateBusinessDetails = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      businessCategory,
      fssaiNumber,
      businessName,
      phoneNumber,
      businessAddress,
      gstinNumber,
      gstSlab,
      gstPercentage
    } = req.body;

    // Handle file upload
    let businessLogo = null;
    if (req.file) {
      businessLogo = `/uploads/${req.file.filename}`;
    }

    const businessData = {
      userId: req.user.id,
      businessCategory: businessCategory || null,
      fssaiNumber: fssaiNumber || null,
      businessName: businessName || null,
      phoneNumber: phoneNumber || null,
      businessAddress: businessAddress || null,
      gstinNumber: gstinNumber || null,
      gstSlab: gstSlab ? parseInt(gstSlab) : null,
      gstPercentage: gstPercentage ? parseFloat(gstPercentage) : null
    };

    if (businessLogo) {
      businessData.businessLogo = businessLogo;
    }

    // Check if business details already exist
    const existingBusiness = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    let businessDetails;
    if (existingBusiness) {
      // Update existing
      await existingBusiness.update(businessData);
      businessDetails = existingBusiness;
    } else {
      // Create new
      businessDetails = await db.BusinessDetails.create(businessData);
    }

    // Remove sensitive data from response
    const response = businessDetails.toJSON();
    delete response.reportsPinHash;

    res.json({
      message: 'Business details saved successfully',
      businessDetails: response
    });

  } catch (error) {
    console.error('Create/update business details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const setReportsPin = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { pin } = req.body;

    // Hash the PIN
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    // Find or create business details
    let businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    if (!businessDetails) {
      businessDetails = await db.BusinessDetails.create({
        userId: req.user.id,
        reportsPinHash: pinHash
      });
    } else {
      await businessDetails.update({ reportsPinHash: pinHash });
    }

    res.json({
      message: 'Reports PIN set successfully'
    });

  } catch (error) {
    console.error('Set reports PIN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBusinessDetails,
  createOrUpdateBusinessDetails,
  setReportsPin,
  businessValidation,
  pinValidation
};
