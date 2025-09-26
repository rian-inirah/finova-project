const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getPSGReports = async (req, res) => {
  try {
    const { 
      fromDateTime, 
      toDateTime 
    } = req.query;

    // Parse datetime strings
    const from = fromDateTime ? moment(fromDateTime) : moment().startOf('day');
    const to = toDateTime ? moment(toDateTime) : moment().endOf('day');

    // Find all orders marked for PSG in the time range
    const psgOrders = await db.Order.findAll({
      where: {
        userId: req.user.id,
        status: 'completed',
        psgMarked: true,
        createdAt: {
          [Op.between]: [from.toDate(), to.toDate()]
        }
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }],
      order: [['createdAt', 'ASC']]
    });

    // Aggregate items across all PSG orders
    const itemAggregation = {};
    let totalOrders = psgOrders.length;
    let totalAmount = 0;

    psgOrders.forEach(order => {
      totalAmount += parseFloat(order.grandTotal);
      
      order.orderItems.forEach(orderItem => {
        const itemId = orderItem.item.id;
        const itemName = orderItem.item.name;
        
        if (!itemAggregation[itemId]) {
          itemAggregation[itemId] = {
            itemId: itemId,
            itemName: itemName,
            totalQuantity: 0,
            totalAmount: 0,
            orders: []
          };
        }
        
        itemAggregation[itemId].totalQuantity += orderItem.quantity;
        itemAggregation[itemId].totalAmount += parseFloat(orderItem.totalPrice);
        itemAggregation[itemId].orders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          quantity: orderItem.quantity,
          amount: parseFloat(orderItem.totalPrice),
          orderDate: order.createdAt
        });
      });
    });

    // Convert to array and sort by quantity
    const psgItems = Object.values(itemAggregation)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Calculate summary
    const totalItems = psgItems.length;
    const totalQuantity = psgItems.reduce((sum, item) => sum + item.totalQuantity, 0);

    res.json({
      psgItems: psgItems,
      summary: {
        totalOrders: totalOrders,
        totalItems: totalItems,
        totalQuantity: totalQuantity,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      },
      dateRange: {
        from: from.format('YYYY-MM-DD HH:mm'),
        to: to.format('YYYY-MM-DD HH:mm')
      }
    });

  } catch (error) {
    console.error('Get PSG reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPSGOrderHistory = async (req, res) => {
  try {
    const { 
      fromDateTime, 
      toDateTime,
      page = 1,
      limit = 20
    } = req.query;

    // Parse datetime strings
    const from = fromDateTime ? moment(fromDateTime) : moment().startOf('day');
    const to = toDateTime ? moment(toDateTime) : moment().endOf('day');

    const offset = (page - 1) * limit;

    const psgOrders = await db.Order.findAndCountAll({
      where: {
        userId: req.user.id,
        status: 'completed',
        psgMarked: true,
        createdAt: {
          [Op.between]: [from.toDate(), to.toDate()]
        }
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      orders: psgOrders.rows,
      pagination: {
        totalCount: psgOrders.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(psgOrders.count / limit),
        hasNext: offset + parseInt(limit) < psgOrders.count,
        hasPrev: page > 1
      },
      dateRange: {
        from: from.format('YYYY-MM-DD HH:mm'),
        to: to.format('YYYY-MM-DD HH:mm')
      }
    });

  } catch (error) {
    console.error('Get PSG order history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPSGItemDetails = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { 
      fromDateTime, 
      toDateTime 
    } = req.query;

    // Parse datetime strings
    const from = fromDateTime ? moment(fromDateTime) : moment().startOf('day');
    const to = toDateTime ? moment(toDateTime) : moment().endOf('day');

    // Find the item
    const item = await db.Item.findOne({
      where: {
        id: itemId,
        userId: req.user.id,
        isActive: true
      },
      attributes: ['id', 'name', 'price']
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Find all PSG orders containing this item
    const psgOrders = await db.Order.findAll({
      where: {
        userId: req.user.id,
        status: 'completed',
        psgMarked: true,
        createdAt: {
          [Op.between]: [from.toDate(), to.toDate()]
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        where: { itemId: itemId },
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calculate item statistics
    let totalQuantity = 0;
    let totalAmount = 0;
    const orderDetails = [];

    psgOrders.forEach(order => {
      const orderItem = order.orderItems.find(oi => oi.itemId === itemId);
      if (orderItem) {
        totalQuantity += orderItem.quantity;
        totalAmount += parseFloat(orderItem.totalPrice);
        
        orderDetails.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          quantity: orderItem.quantity,
          unitPrice: parseFloat(orderItem.unitPrice),
          totalPrice: parseFloat(orderItem.totalPrice),
          orderDate: order.createdAt,
          paymentMethod: order.paymentMethod
        });
      }
    });

    res.json({
      item: item,
      statistics: {
        totalQuantity: totalQuantity,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageQuantity: psgOrders.length > 0 ? (totalQuantity / psgOrders.length).toFixed(2) : 0,
        orderCount: psgOrders.length
      },
      orderDetails: orderDetails,
      dateRange: {
        from: from.format('YYYY-MM-DD HH:mm'),
        to: to.format('YYYY-MM-DD HH:mm')
      }
    });

  } catch (error) {
    console.error('Get PSG item details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPSGReports,
  getPSGOrderHistory,
  getPSGItemDetails
};
