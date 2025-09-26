const { body, validationResult } = require('express-validator');
const db = require('../models');

const itemValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item name must be between 1 and 200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
];

const getAllItems = async (req, res) => {
  try {
    const { search } = req.query;
    
    const whereClause = {
      userId: req.user.id,
      isActive: true
    };

    if (search) {
      whereClause.name = {
        [db.Sequelize.Op.iLike]: `%${search}%`
      };
    }

    const items = await db.Item.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'price', 'image', 'createdAt']
    });

    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db.Item.findOne({
      where: {
        id: id,
        userId: req.user.id,
        isActive: true
      },
      attributes: ['id', 'name', 'price', 'image', 'createdAt']
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createItem = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, price } = req.body;

    // Handle file upload
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const itemData = {
      userId: req.user.id,
      name: name.trim(),
      price: parseFloat(price),
      image: image
    };

    const item = await db.Item.create(itemData);

    res.status(201).json({
      message: 'Item created successfully',
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        createdAt: item.createdAt
      }
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateItem = async (req, res) => {
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
    const { name, price } = req.body;

    // Find the item
    const item = await db.Item.findOne({
      where: {
        id: id,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updateData = {
      name: name.trim(),
      price: parseFloat(price)
    };

    // Handle file upload (only if new image is provided)
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await item.update(updateData);

    res.json({
      message: 'Item updated successfully',
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        createdAt: item.createdAt
      }
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({ 
        error: 'Deletion confirmation required' 
      });
    }

    // Find the item
    const item = await db.Item.findOne({
      where: {
        id: id,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Soft delete
    await item.update({ isActive: false });

    res.json({
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  itemValidation
};
