const mongoose = require('mongoose');


const rentalHistorySchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Property ID is required']
  },

  guest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Guest ID is required']
  },

  period: {
    check_in: {
      type: Date,
      required: [true, 'Check-in date is required']
    },
    check_out: {
      type: Date,
      required: [true, 'Check-out date is required']
    }
  },

  nights: {
    type: Number,
    required: [true, 'Number of nights is required'],
    min: [1, 'Nights must be at least 1']
  },

  gross: {
    type: Number,
    required: [true, 'Gross amount is required'],
    min: [0, 'Gross amount cannot be negative']
  },

  net: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative']
  },

  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});


rentalHistorySchema.index({ property_id: 1, guest_id: 1 });
rentalHistorySchema.index({ guest_id: 1, created_at: -1 });
rentalHistorySchema.index({ property_id: 1, created_at: -1 });
rentalHistorySchema.index({ 'period.check_in': 1, 'period.check_out': 1 });


rentalHistorySchema.methods.toJSON = function() {
  const historyObject = this.toObject();
  return historyObject;
};

module.exports = mongoose.model('RentalHistory', rentalHistorySchema);
