const bcrypt = require('bcryptjs');
const db = require('../models');

const verifyReportsPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format. Must be 4 digits.' });
    }

    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    if (!businessDetails || !businessDetails.reportsPinHash) {
      return res.status(404).json({ error: 'PIN not set. Please set a PIN first.' });
    }

    const isValidPin = await bcrypt.compare(pin, businessDetails.reportsPinHash);
    
    if (!isValidPin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // PIN is valid, continue to the protected route
    next();
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({ error: 'Internal server error during PIN verification' });
  }
};

module.exports = {
  verifyReportsPin
};
