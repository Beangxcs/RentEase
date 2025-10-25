const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/UsersModel');
const connectDB = require('../configs/database');

dotenv.config();

const users = [
  {
    fullName: 'Admin User',
    email: 'admin@rentease.com',
    password: 'Admin@123',
    userType: 'admin',
    valid_id: 'ADMIN-ID-001',
    is_id_verified: true,
    age: 35,
    address: '123 Admin Street, Metro Manila, Philippines',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'SSS-12345678',
    is_id_verified: true,
    age: 28,
    address: '456 Makati Avenue, Makati City, Metro Manila',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'Maria Santos',
    email: 'maria.santos@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'UMID-87654321',
    is_id_verified: true,
    age: 32,
    address: '789 Taft Avenue, Pasay City, Metro Manila',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'Robert Chen',
    email: 'robert.chen@example.com',
    password: 'Password@123',
    userType: 'staff',
    valid_id: 'PASSPORT-ABC123',
    is_id_verified: true,
    age: 26,
    address: '321 Ortigas Center, Pasig City, Metro Manila',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'Ana Reyes',
    email: 'ana.reyes@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'DRIVERS-456789',
    is_id_verified: false,
    age: 24,
    address: '654 Quezon Avenue, Quezon City, Metro Manila',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'Michael Torres',
    email: 'michael.torres@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'POSTAL-123456',
    is_id_verified: true,
    age: 30,
    address: '987 España Boulevard, Manila City, Metro Manila',
    is_verified: true,
    isActive: false
  },
  {
    fullName: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'TIN-987654321',
    is_id_verified: false,
    age: 27,
    address: '159 BGC, Taguig City, Metro Manila',
    is_verified: false,
    isActive: false
  },
  {
    fullName: 'David Cruz',
    email: 'david.cruz@example.com',
    password: 'Password@123',
    userType: 'staff',
    valid_id: 'PRC-246810',
    is_id_verified: true,
    age: 29,
    address: '753 Alabang, Muntinlupa City, Metro Manila',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'Isabella Garcia',
    email: 'isabella.garcia@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'GSIS-135792',
    is_id_verified: true,
    age: 33,
    address: '246 Cubao, Quezon City, Metro Manila',
    is_verified: true,
    isActive: true
  },
  {
    fullName: 'James Lim',
    email: 'james.lim@example.com',
    password: 'Password@123',
    userType: 'rentor',
    valid_id: 'PHILHEALTH-864209',
    is_id_verified: false,
    age: 25,
    address: '135 Mandaluyong City, Metro Manila, Philippines',
    is_verified: false,
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB...');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users...');

    // Insert seed data
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Successfully seeded ${createdUsers.length} users!`);

    // Display created users
    console.log('\n📋 Created Users:');
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - ${user.userType}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  }
};

// Run seeder
seedUsers();
