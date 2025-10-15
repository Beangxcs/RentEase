const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`Successfully connected to MongoDB database at: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    console.error('Make sure MongoDB is running and your connection string is correct');
    process.exit(1);
  }
};


module.exports = connectDB;