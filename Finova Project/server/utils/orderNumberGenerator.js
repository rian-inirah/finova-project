const db = require('../models');
const moment = require('moment');

const generateOrderNumber = async () => {
  const today = moment().format('YYYYMMDD');
  const prefix = `FN-${today}-`;
  
  try {
    // Find the highest order number for today
    const lastOrder = await db.Order.findOne({
      where: {
        orderNumber: {
          [db.Sequelize.Op.like]: `${prefix}%`
        }
      },
      order: [['orderNumber', 'DESC']],
      attributes: ['orderNumber']
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    // Ensure 6-digit sequence with leading zeros
    const orderNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;
    
    return orderNumber;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
};

module.exports = {
  generateOrderNumber
};
