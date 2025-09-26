const { body, validationResult } = require('express-validator');
const db = require('../models');
const { generateOrderNumber } = require('../utils/orderNumberGenerator');

const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.itemId')
    .isInt({ min: 1 })
    .withMessage('Invalid item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('customerPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'online'])
    .withMessage('Payment method must be either cash or online'),
  body('status')
    .optional()
    .isIn(['draft', 'completed'])
    .withMessage('Status must be either draft or completed'),
  body('psgMarked')
    .optional()
    .isBoolean()
    .withMessage('PSG marked must be a boolean')
];

const createOrder = async (req, res) => {
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
      items, 
      customerPhone, 
      paymentMethod, 
      status = 'draft',
      psgMarked = false 
    } = req.body;

    // For completed orders, payment method is required
    if (status === 'completed' && !paymentMethod) {
      return res.status(400).json({ 
        error: 'Payment method is required for completed orders' 
      });
    }

    // Validate that all items belong to the user
    const itemIds = items.map(item => item.itemId);
    const userItems = await db.Item.findAll({
      where: {
        id: itemIds,
        userId: req.user.id,
        isActive: true
      },
      attributes: ['id', 'name', 'price']
    });

    if (userItems.length !== itemIds.length) {
      return res.status(400).json({ 
        error: 'One or more items not found or inactive' 
      });
    }

    // Create item map for quick lookup
    const itemMap = {};
    userItems.forEach(item => {
      itemMap[item.id] = item;
    });

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const dbItem = itemMap[item.itemId];
      const unitPrice = dbItem.price;
      const quantity = parseInt(item.quantity);
      const totalPrice = unitPrice * quantity;
      
      subtotal += totalPrice;
      
      orderItems.push({
        itemId: item.itemId,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });
    }

    // Get business details for GST calculation
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    let gstAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let grandTotal = subtotal;

    if (businessDetails && businessDetails.gstPercentage > 0) {
      gstAmount = (subtotal * businessDetails.gstPercentage) / 100;
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
      grandTotal = subtotal + gstAmount;
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await db.Order.create({
      userId: req.user.id,
      orderNumber,
      customerPhone: customerPhone || null,
      status,
      paymentMethod: paymentMethod || null,
      subtotal,
      gstAmount,
      cgst,
      sgst,
      grandTotal,
      psgMarked,
      printed: false
    });

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      orderId: order.id
    }));

    await db.OrderItem.bulkCreate(orderItemsWithOrderId);

    // Fetch the complete order with items
    const completeOrder = await db.Order.findByPk(order.id, {
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      userId: req.user.id
    };

    if (status) {
      whereClause.status = status;
    }

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

    res.json({
      orders: orders.rows,
      totalCount: orders.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(orders.count / limit)
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOrder = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { 
      items, 
      customerPhone, 
      paymentMethod, 
      status,
      psgMarked 
    } = req.body;

    // Find the order
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // For completed orders, payment method is required
    if (status === 'completed' && !paymentMethod) {
      return res.status(400).json({ 
        error: 'Payment method is required for completed orders' 
      });
    }

    // If items are provided, recalculate totals
    if (items && items.length > 0) {
      // Validate that all items belong to the user
      const itemIds = items.map(item => item.itemId);
      const userItems = await db.Item.findAll({
        where: {
          id: itemIds,
          userId: req.user.id,
          isActive: true
        },
        attributes: ['id', 'name', 'price']
      });

      if (userItems.length !== itemIds.length) {
        return res.status(400).json({ 
          error: 'One or more items not found or inactive' 
        });
      }

      // Create item map for quick lookup
      const itemMap = {};
      userItems.forEach(item => {
        itemMap[item.id] = item;
      });

      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const dbItem = itemMap[item.itemId];
        const unitPrice = dbItem.price;
        const quantity = parseInt(item.quantity);
        const totalPrice = unitPrice * quantity;
        
        subtotal += totalPrice;
        
        orderItems.push({
          itemId: item.itemId,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice
        });
      }

      // Get business details for GST calculation
      const businessDetails = await db.BusinessDetails.findOne({
        where: { userId: req.user.id }
      });

      let gstAmount = 0;
      let cgst = 0;
      let sgst = 0;
      let grandTotal = subtotal;

      if (businessDetails && businessDetails.gstPercentage > 0) {
        gstAmount = (subtotal * businessDetails.gstPercentage) / 100;
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
        grandTotal = subtotal + gstAmount;
      }

      // Update order totals
      await order.update({
        subtotal,
        gstAmount,
        cgst,
        sgst,
        grandTotal
      });

      // Delete existing order items
      await db.OrderItem.destroy({
        where: { orderId: order.id }
      });

      // Create new order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        orderId: order.id
      }));

      await db.OrderItem.bulkCreate(orderItemsWithOrderId);
    }

    // Update other fields
    const updateData = {};
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (status !== undefined) updateData.status = status;
    if (psgMarked !== undefined) updateData.psgMarked = psgMarked;

    if (Object.keys(updateData).length > 0) {
      await order.update(updateData);
    }

    // Fetch the complete updated order
    const updatedOrder = await db.Order.findByPk(order.id, {
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id,
        status: 'draft' // Only allow deletion of draft orders
      }
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found or cannot be deleted' 
      });
    }

    // Delete order items first
    await db.OrderItem.destroy({
      where: { orderId: order.id }
    });

    // Delete the order
    await order.destroy();

    res.json({
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markOrderPrinted = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id,
        status: 'completed'
      }
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Completed order not found' 
      });
    }

    // Mark as printed
    await order.update({
      printed: true,
      printedAt: new Date()
    });

    res.json({
      message: 'Order marked as printed successfully'
    });

  } catch (error) {
    console.error('Mark order printed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  markOrderPrinted,
  orderValidation
};
