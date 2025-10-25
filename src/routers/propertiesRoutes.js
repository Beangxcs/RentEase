const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getPropertiesStats
} = require('../controllers/propertiesController');
const { authenticate, authorize } = require('../middleware/auth');

const storageDir = path.join(__dirname, '../../storage/properties');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${req.user._id}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});


/**
 * @route   GET /api/properties/stats
 * @desc    Get properties statistics
 * @access  Private (Admin only)
 * @body    None
 */
router.get('/stats', authenticate, authorize('admin'), getPropertiesStats);

/**
 * @route   GET /api/properties/my-properties
 * @desc    Get current user's properties
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.get('/my-properties', authenticate, getMyProperties);

/**
 * @route   POST /api/properties
 * @desc    Create new property
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { item_name, description?, category, price, location: {barangay, city, province}, rooms?, bed?, bathroom? }
 * @file    pictures[] (required, multiple files allowed, max 10)
 */
router.post('/', authenticate, upload.array('pictures', 10), createProperty);

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filtering and pagination (excludes disabled properties)
 * @access  Public
 * @query   page, limit, category, city, province, barangay, minPrice, maxPrice, search
 * @body    None
 */
router.get('/', getAllProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get single property by ID
 * @access  Public
 * @body    None
 */
router.get('/:id', getPropertyById);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property (all fields optional)
 * @access  Private (Owner or Admin)
 * @headers Authorization: Bearer <token>
 * @body    { item_name?, description?, category?, price?, location?, disable?, rooms?, bed?, bathroom?, removePictures? }
 * @file    pictures[]? (optional, multiple files allowed, max 10)
 */
router.put('/:id', authenticate, upload.array('pictures', 10), updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Private (Owner or Admin)
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.delete('/:id', authenticate, deleteProperty);

module.exports = router;