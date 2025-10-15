const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
  picture: {
    type: String,
    required: [true, 'Picture is required'],
    trim: true
  },
  
  item_name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
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
    }
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters']
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

itemSchema.index({ category: 1, location: 1, disable: 1 });
itemSchema.index({ uploadedBy: 1 });
itemSchema.index({ item_name: 'text', description: 'text' }); 


itemSchema.methods.toJSON = function() {
  const itemObject = this.toObject();
  return itemObject;
};

module.exports = mongoose.model('Item', itemSchema);