const mongoose = require('mongoose');


const bookingsSchema = new mongoose.Schema({
  guest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Guest ID is required']
  },

  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required']
  },

  check_in: {
    type: Date,
    required: [true, 'Check-in date is required']
  },

  check_out: {
    type: Date,
    required: [true, 'Check-out date is required']
  },

  nights: {
    type: Number,
    required: [true, 'Number of nights is required'],
    min: [1, 'Nights must be at least 1']
  },

  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },

  deduction: {
    type: Number,
    default: 0,
    min: [0, 'Deduction cannot be negative']
  },

  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'cancelled'],
      message: 'Status must be one of: pending, approved, rejected, cancelled'
    },
    default: 'pending'
  },

  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});


bookingsSchema.index({ guest_id: 1, status: 1 });
bookingsSchema.index({ property_id: 1, status: 1 });
bookingsSchema.index({ check_in: 1, check_out: 1 });


bookingsSchema.methods.toJSON = function() {
  const bookingObject = this.toObject();
  return bookingObject;
};

module.exports = mongoose.model('Bookings', bookingsSchema);
