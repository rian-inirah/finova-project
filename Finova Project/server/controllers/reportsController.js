const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getOrderReports = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      paymentType,
      page = 1,
      limit = 50
    } = req.query;

    // Default to current day if no dates provided
    const from = fromDate ? moment(fromDate).startOf('day') : moment().startOf('day');
    const to = toDate ? moment(toDate).endOf('day') : moment().endOf('day');

    const whereClause = {
      userId: req.user.id,
      status: 'completed',
      createdAt: {
        [Op.between]: [from.toDate(), to.toDate()]
      }
    };

    // Add payment type filter if specified
    if (paymentType && paymentType !== 'all') {
      whereClause.paymentMethod = paymentType;
    }

    const offset = (page - 1) * limit;

    const orders = await db.Order.findAndCountAll({
      where: whereClause,
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

    // Calculate summary statistics
    const summary = await db.Order.findAll({
      where: whereClause,
      attributes: [
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalOrders'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('grandTotal')), 'totalAmount'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('gstAmount')), 'totalGST'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('subtotal')), 'totalSubtotal']
      ],
      raw: true
    });

    // Payment method breakdown
    const paymentBreakdown = await db.Order.findAll({
      where: whereClause,
      attributes: [
        'paymentMethod',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('grandTotal')), 'amount']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    res.json({
      orders: orders.rows,
      pagination: {
        totalCount: orders.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(orders.count / limit),
        hasNext: offset + parseInt(limit) < orders.count,
        hasPrev: page > 1
      },
      summary: summary[0] || {
        totalOrders: 0,
        totalAmount: 0,
        totalGST: 0,
        totalSubtotal: 0
      },
      paymentBreakdown: paymentBreakdown,
      dateRange: {
        from: from.format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Get order reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getItemReports = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      itemId,
      page = 1,
      limit = 50
    } = req.query;

    // Default to current day if no dates provided
    const from = fromDate ? moment(fromDate).startOf('day') : moment().startOf('day');
    const to = toDate ? moment(toDate).endOf('day') : moment().endOf('day');

    const whereClause = {
      userId: req.user.id,
      status: 'completed',
      createdAt: {
        [Op.between]: [from.toDate(), to.toDate()]
      }
    };

    // Build the query for item-wise aggregation
    const itemReportQuery = {
      attributes: [
        [db.Sequelize.col('orderItems.item.id'), 'itemId'],
        [db.Sequelize.col('orderItems.item.name'), 'itemName'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('orderItems.quantity')), 'totalQuantity'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('orderItems.totalPrice')), 'totalAmount'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('orderItems.unitPrice')), 'averagePrice'],
        [db.Sequelize.fn('COUNT', db.Sequelize.literal('DISTINCT orders.id')), 'orderCount']
      ],
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: []
        }]
      }],
      where: whereClause,
      group: [
        'orderItems.item.id',
        'orderItems.item.name'
      ],
      order: [
        [db.Sequelize.literal('totalQuantity'), 'DESC']
      ],
      raw: false,
      subQuery: false
    };

    // Add item filter if specified
    if (itemId) {
      itemReportQuery.include[0].where = { itemId: itemId };
    }

    const itemReports = await db.Order.findAll(itemReportQuery);

    // Format the results
    const formattedReports = itemReports.map(order => {
      const orderItems = order.orderItems || [];
      const firstItem = orderItems[0];
      
      if (!firstItem) return null;

      return {
        itemId: firstItem.item.id,
        itemName: firstItem.item.name,
        totalQuantity: parseInt(firstItem.getDataValue('totalQuantity')) || 0,
        totalAmount: parseFloat(firstItem.getDataValue('totalAmount')) || 0,
        averagePrice: parseFloat(firstItem.getDataValue('averagePrice')) || 0,
        orderCount: parseInt(firstItem.getDataValue('orderCount')) || 0
      };
    }).filter(Boolean);

    // Calculate summary
    const totalItems = formattedReports.length;
    const totalQuantity = formattedReports.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalAmount = formattedReports.reduce((sum, item) => sum + item.totalAmount, 0);

    res.json({
      itemReports: formattedReports,
      summary: {
        totalItems,
        totalQuantity,
        totalAmount
      },
      dateRange: {
        from: from.format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Get item reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDailyReports = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate,
      groupBy = 'day' // day, week, month
    } = req.query;

    // Default to last 30 days if no dates provided
    const from = fromDate ? moment(fromDate) : moment().subtract(30, 'days');
    const to = toDate ? moment(toDate) : moment();

    const whereClause = {
      userId: req.user.id,
      status: 'completed',
      createdAt: {
        [Op.between]: [from.startOf('day').toDate(), to.endOf('day').toDate()]
      }
    };

    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const dailyReports = await db.Order.findAll({
      where: whereClause,
      attributes: [
        [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('createdAt'), dateFormat), 'date'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'orderCount'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('grandTotal')), 'totalAmount'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('subtotal')), 'subtotal'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('gstAmount')), 'gstAmount'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('grandTotal')), 'averageOrderValue']
      ],
      group: [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('createdAt'), dateFormat)],
      order: [[db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('createdAt'), dateFormat), 'ASC']],
      raw: true
    });

    res.json({
      dailyReports: dailyReports,
      dateRange: {
        from: from.format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD')
      },
      groupBy: groupBy
    });

  } catch (error) {
    console.error('Get daily reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTopSellingItems = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate,
      limit = 10
    } = req.query;

    // Default to last 30 days if no dates provided
    const from = fromDate ? moment(fromDate).startOf('day') : moment().subtract(30, 'days').startOf('day');
    const to = toDate ? moment(toDate).endOf('day') : moment().endOf('day');

    const whereClause = {
      userId: req.user.id,
      status: 'completed',
      createdAt: {
        [Op.between]: [from.toDate(), to.toDate()]
      }
    };

    const topItems = await db.Order.findAll({
      attributes: [
        [db.Sequelize.col('orderItems.item.id'), 'itemId'],
        [db.Sequelize.col('orderItems.item.name'), 'itemName'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('orderItems.quantity')), 'totalQuantity'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('orderItems.totalPrice')), 'totalAmount']
      ],
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: []
        }]
      }],
      where: whereClause,
      group: [
        'orderItems.item.id',
        'orderItems.item.name'
      ],
      order: [
        [db.Sequelize.literal('totalQuantity'), 'DESC']
      ],
      limit: parseInt(limit),
      raw: false,
      subQuery: false
    });

    // Format the results
    const formattedTopItems = topItems.map(order => {
      const orderItems = order.orderItems || [];
      const firstItem = orderItems[0];
      
      if (!firstItem) return null;

      return {
        itemId: firstItem.item.id,
        itemName: firstItem.item.name,
        totalQuantity: parseInt(firstItem.getDataValue('totalQuantity')) || 0,
        totalAmount: parseFloat(firstItem.getDataValue('totalAmount')) || 0
      };
    }).filter(Boolean);

    res.json({
      topItems: formattedTopItems,
      dateRange: {
        from: from.format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Get top selling items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getOrderReports,
  getItemReports,
  getDailyReports,
  getTopSellingItems
};
