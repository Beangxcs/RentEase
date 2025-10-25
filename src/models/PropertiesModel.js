const mongoose = require('mongoose');


const propertySchema = new mongoose.Schema({
  pictures: {
    type: [String],
    required: [true, 'At least one picture is required'],
    validate: {
      validator: function(arr) {
        return arr && arr.length > 0;
      },
      message: 'At least one picture is required'
    }
  },
  
  item_name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true,
    maxlength: [200, 'Property name cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Vehicle', 'Apartment', 'Equipment'],
      message: 'Category must be Vehicle, Apartment, or Equipment'
    },
    default: 'Apartment'
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  rooms: {
    type: Number,
    min: [0, 'Rooms cannot be negative'],
    default: 0
  },
  
  bed: {
    type: Number,
    min: [0, 'Beds cannot be negative'],
    default: 0
  },
  
  bathroom: {
    type: Number,
    min: [0, 'Bathrooms cannot be negative'],
    default: 0
  },
  
  location: {
    barangay: {
      type: String,
      required: [true, 'Barangay is required'],
      trim: true,
      maxlength: [100, 'Barangay cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
      maxlength: [100, 'Province cannot exceed 100 characters']
    }
  },
  
  disable: {
    type: Boolean,
    default: false
  },
  
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  }
}, {
  timestamps: true 
});

propertySchema.index({ category: 1, 'location.city': 1, 'location.province': 1, disable: 1 });
propertySchema.index({ uploadedBy: 1 });
propertySchema.index({ item_name: 'text', description: 'text' }); 


propertySchema.methods.toJSON = function() {
  const propertyObject = this.toObject();
  return propertyObject;
};

module.exports = mongoose.model('Property', propertySchema);