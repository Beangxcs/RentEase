const Item = require('../models/ItemsModel');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Create new item
 * @route   POST /api/items
 * @access  Private
 */
const createItem = async (req, res) => {
  try {
    const { item_name, description, category, price, location } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Picture is required'
      });
    }

    const item = await Item.create({
      picture: req.file.path, 
      item_name,
      description: description || '',
      category,
      price: parseFloat(price),
      location,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { item }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all items
 * @route   GET /api/items
 * @access  Public
 */
const getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      minPrice,
      maxPrice,
      search,
      showDisabled = false
    } = req.query;

    const filter = {};
    
    if (showDisabled !== 'true') {
      filter.disable = false;
    }
    
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Execute query with pagination
    const items = await Item.find(filter)
      .populate('uploadedBy', 'fullName email')
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(filter);

    res.json({
      success: true,
      message: 'Items retrieved successfully',
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single item
 * @route   GET /api/items/:id
 * @access  Public
 */
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('uploadedBy', 'fullName email userType');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.disable && (!req.user || req.user.userType !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item retrieved successfully',
      data: { item }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update item
 * @route   PUT /api/items/:id
 * @access  Private (Owner or Admin)
 */
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.uploadedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    const updateData = {};
    const { item_name, description, category, price, location, disable } = req.body;

    if (item_name !== undefined) updateData.item_name = item_name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (location !== undefined) updateData.location = location;
    if (disable !== undefined) updateData.disable = disable;

    if (req.file) {
      if (item.picture && fs.existsSync(item.picture)) {
        fs.unlinkSync(item.picture);
      }
      updateData.picture = req.file.path;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'fullName email');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { item: updatedItem }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete item
 * @route   DELETE /api/items/:id
 * @access  Private (Owner or Admin)
 */
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.uploadedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    if (item.picture && fs.existsSync(item.picture)) {
      fs.unlinkSync(item.picture);
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get user's items
 * @route   GET /api/items/my-items
 * @access  Private
 */
const getMyItems = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const items = await Item.find({ uploadedBy: req.user._id })
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments({ uploadedBy: req.user._id });

    res.json({
      success: true,
      message: 'Your items retrieved successfully',
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get items statistics
 * @route   GET /api/items/stats
 * @access  Private (Admin only)
 */
const getItemsStats = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const enabledItems = await Item.countDocuments({ disable: false });
    const disabledItems = await Item.countDocuments({ disable: true });
    
    const categoryStats = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const recentItems = await Item.countDocuments({
      uploadedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      message: 'Items statistics retrieved successfully',
      data: {
        stats: {
          total: totalItems,
          enabled: enabledItems,
          disabled: disabledItems,
          recentItems: recentItems,
          byCategory: categoryStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
  getItemsStats
};