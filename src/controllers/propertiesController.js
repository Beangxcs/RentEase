const Property = require('../models/PropertiesModel');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Create new property
 * @route   POST /api/properties
 * @access  Private
 */
const createProperty = async (req, res) => {
  try {
    const { item_name, description, category, price, location, rooms, bed, bathroom } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one picture is required'
      });
    }

    // Parse location if it's sent as JSON string
    let locationObj;
    if (typeof location === 'string') {
      try {
        locationObj = JSON.parse(location);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location format. Must include barangay, city, and province'
        });
      }
    } else {
      locationObj = location;
    }

    // Validate location object
    if (!locationObj || !locationObj.barangay || !locationObj.city || !locationObj.province) {
      return res.status(400).json({
        success: false,
        message: 'Location must include barangay, city, and province'
      });
    }

    const property = await Property.create({
      pictures: req.files.map(file => file.path), 
      item_name,
      description: description || '',
      category,
      price: parseFloat(price),
      location: locationObj,
      rooms: rooms ? parseInt(rooms) : 0,
      bed: bed ? parseInt(bed) : 0,
      bathroom: bathroom ? parseInt(bathroom) : 0,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: { property }
    });

  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all properties
 * @route   GET /api/properties
 * @access  Public
 */
const getAllProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      city,
      province,
      barangay,
      minPrice,
      maxPrice,
      search
    } = req.query;

    const filter = { disable: false }; // Always filter out disabled properties
    
    if (category) filter.category = category;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (province) filter['location.province'] = { $regex: province, $options: 'i' };
    if (barangay) filter['location.barangay'] = { $regex: barangay, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Get all properties matching the filter
    let properties = await Property.find(filter)
      .populate('uploadedBy', 'fullName email')
      .sort({ uploadedAt: -1 });

    // Get all approved bookings to filter out booked properties
    const Bookings = require('../models/BookingsModel');
    const bookedPropertyIds = await Bookings.distinct('property_id', { status: 'approved' });

    // Filter out properties that are currently booked
    properties = properties.filter(property => 
      !bookedPropertyIds.some(id => id.toString() === property._id.toString())
    );

    // Apply pagination after filtering
    const total = properties.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProperties = properties.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Properties retrieved successfully',
      data: {
        properties: paginatedProperties,
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
 * @desc    Get single property
 * @route   GET /api/properties/:id
 * @access  Public
 */
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('uploadedBy', 'fullName email userType');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.disable && (!req.user || req.user.userType !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      message: 'Property retrieved successfully',
      data: { property }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update property
 * @route   PUT /api/properties/:id
 * @access  Private (Owner or Admin)
 */
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.uploadedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
    }

    const updateData = {};
    const { item_name, description, category, price, location, disable, rooms, bed, bathroom, removePictures } = req.body;

    if (item_name !== undefined) updateData.item_name = item_name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (rooms !== undefined) updateData.rooms = parseInt(rooms);
    if (bed !== undefined) updateData.bed = parseInt(bed);
    if (bathroom !== undefined) updateData.bathroom = parseInt(bathroom);
    if (disable !== undefined) updateData.disable = disable;
    
    if (location !== undefined) {
      let locationObj;
      if (typeof location === 'string') {
        try {
          locationObj = JSON.parse(location);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Invalid location format'
          });
        }
      } else {
        locationObj = location;
      }
      updateData.location = locationObj;
    }

    // Handle picture removal
    if (removePictures) {
      let picturesToRemove = [];
      if (typeof removePictures === 'string') {
        try {
          picturesToRemove = JSON.parse(removePictures);
        } catch (e) {
          picturesToRemove = [removePictures];
        }
      } else if (Array.isArray(removePictures)) {
        picturesToRemove = removePictures;
      }

      // Remove files from disk
      picturesToRemove.forEach(picPath => {
        if (fs.existsSync(picPath)) {
          fs.unlinkSync(picPath);
        }
      });

      // Remove from array
      updateData.pictures = property.pictures.filter(pic => !picturesToRemove.includes(pic));
    }

    // Handle new pictures upload
    if (req.files && req.files.length > 0) {
      const newPictures = req.files.map(file => file.path);
      if (updateData.pictures) {
        updateData.pictures = [...updateData.pictures, ...newPictures];
      } else {
        updateData.pictures = [...property.pictures, ...newPictures];
      }
    }

    // Validate at least one picture remains
    const finalPictures = updateData.pictures || property.pictures;
    if (!finalPictures || finalPictures.length === 0) {
      // Clean up newly uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Property must have at least one picture'
      });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'fullName email');

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property: updatedProperty }
    });

  } catch (error) {
    // Clean up newly uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private (Owner or Admin)
 */
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.uploadedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
    }

    // Delete all pictures from disk
    if (property.pictures && property.pictures.length > 0) {
      property.pictures.forEach(picturePath => {
        if (fs.existsSync(picturePath)) {
          fs.unlinkSync(picturePath);
        }
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get user's properties
 * @route   GET /api/properties/my-properties
 * @access  Private
 */
const getMyProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const properties = await Property.find({ uploadedBy: req.user._id })
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments({ uploadedBy: req.user._id });

    res.json({
      success: true,
      message: 'Your properties retrieved successfully',
      data: {
        properties,
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
 * @desc    Get properties statistics
 * @route   GET /api/properties/stats
 * @access  Private (Admin only)
 */
const getPropertiesStats = async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const enabledProperties = await Property.countDocuments({ disable: false });
    const disabledProperties = await Property.countDocuments({ disable: true });
    
    const categoryStats = await Property.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const recentProperties = await Property.countDocuments({
      uploadedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      message: 'Properties statistics retrieved successfully',
      data: {
        stats: {
          total: totalProperties,
          enabled: enabledProperties,
          disabled: disabledProperties,
          recentProperties: recentProperties,
          byCategory: categoryStats.reduce((acc, property) => {
            acc[property._id] = property.count;
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
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getPropertiesStats
};