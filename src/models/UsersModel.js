const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  fullName: {
    type: String,                                    
    required: [true, 'Full name is required'],     
    trim: true,                                     
    maxlength: [100, 'Full name cannot exceed 100 characters'] 
  }, 
  
  email: {
    type: String,                                    
    required: [true, 'Email is required'],          
    unique: true,                                    
    lowercase: true,                                 
    trim: true,                                      
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 
      'Please enter a valid email address'           
    ]
  },
  
  password: {
    type: String,                                   
    required: [true, 'Password is required'],      
    minlength: [8, 'Password must be at least 8 characters long'] 
  },
  
  userType: {
    type: String,                                    
    enum: ['admin', 'staff', 'rentor'],                       
    required: [true, 'User type is required'],     
    default: 'rentor'                                
  },

  valid_id: {
    type: String,
    required: [true, 'Valid ID is required'],
    trim: true,
    minlength: [3, 'Valid ID must be at least 3 characters']
  },

  is_id_verified: {
    type: Boolean,
    default: false
  },

  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'You must be at least 18 years old']
  },

  is_verified: {
    type: Boolean,                                   
    default: false                                  
  },

  isActive: {
    type: Boolean,                                  
    default: false                                   
  },

  last_activity: {
    type: Date,                                      
    default: null                                    
  }
  }, {
  timestamps: true 
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next(); 
  } catch (error) {
    next(error); 
  }
});


userSchema.methods.matchPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.toJSON = function() {
  const userObject = this.toObject();           
  delete userObject.password;                   
  return userObject;                            
};


userSchema.methods.updateLastActivity = async function() {
  this.last_activity = new Date();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);