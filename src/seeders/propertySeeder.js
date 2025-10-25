const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Property = require('../models/PropertiesModel');
const User = require('../models/UsersModel');
const connectDB = require('../configs/database');

dotenv.config();

const properties = [
  {
    item_name: 'Modern 2BR Condo in Makati',
    description: 'Fully furnished 2-bedroom condo unit with stunning city view. Features modern kitchen, spacious living area, and 24/7 security. Perfect for professionals and small families.',
    category: 'Apartment',
    price: 25000,
    rooms: 2,
    bed: 2,
    bathroom: 2,
    location: {
      barangay: 'San Antonio',
      city: 'Makati',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image8.1.jpg',
      'storage/property_seeder/seeder_image8.2.jpg',
      'storage/property_seeder/seeder_image8.3.jpg',
      'storage/property_seeder/seeder_image8.4.jpg'
    ]
  },
  {
    item_name: 'Luxury Studio in BGC',
    description: 'High-end studio unit in the heart of Bonifacio Global City. Features premium amenities including gym, pool, and rooftop lounge. Walking distance to shops and restaurants.',
    category: 'Apartment',
    price: 30000,
    rooms: 1,
    bed: 1,
    bathroom: 1,
    location: {
      barangay: 'Fort Bonifacio',
      city: 'Taguig',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image9.1.jpg',
      'storage/property_seeder/seeder_image9.2.jpg',
      'storage/property_seeder/seeder_image9.3.jpg',
      'storage/property_seeder/seeder_image9.4.jpg'
    ]
  },
  {
    item_name: 'Cozy 1BR Apartment in Quezon City',
    description: 'Affordable and comfortable 1-bedroom apartment perfect for singles or couples. Near major universities and shopping centers. Includes parking space.',
    category: 'Apartment',
    price: 15000,
    rooms: 1,
    bed: 1,
    bathroom: 1,
    location: {
      barangay: 'Diliman',
      city: 'Quezon City',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image10.1.jpg',
      'storage/property_seeder/seeder_image10.2.jpg',
      'storage/property_seeder/seeder_image10.3.jpg',
      'storage/property_seeder/seeder_image10.4.jpg'
    ]
  },
  {
    item_name: 'Spacious 3BR House in Pasig',
    description: 'Beautiful 3-bedroom house with garden and garage. Perfect for families. Features spacious living room, dining area, and modern kitchen. Near schools and markets.',
    category: 'Apartment',
    price: 35000,
    rooms: 3,
    bed: 3,
    bathroom: 2,
    location: {
      barangay: 'Kapitolyo',
      city: 'Pasig',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image11.1.jpg',
      'storage/property_seeder/seeder_image11.2.jpg',
      'storage/property_seeder/seeder_image11.3.jpg',
      'storage/property_seeder/seeder_image11.4.jpg'
    ]
  },
  {
    item_name: 'Elegant 2BR Townhouse in Mandaluyong',
    description: 'Two-story townhouse with 2 bedrooms, 2 bathrooms. Features modern design, private garage, and small backyard. Located in a quiet residential area with easy access to major roads.',
    category: 'Apartment',
    price: 28000,
    rooms: 2,
    bed: 2,
    bathroom: 2,
    location: {
      barangay: 'Poblacion',
      city: 'Mandaluyong',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image12.1.jpg',
      'storage/property_seeder/seeder_image12.2.jpg',
      'storage/property_seeder/seeder_image12.3.jpg',
      'storage/property_seeder/seeder_image12.4.jpg'
    ]
  },
  {
    item_name: 'Affordable Studio in Manila',
    description: 'Budget-friendly studio apartment ideal for students and young professionals. Fully furnished with basic amenities. Located near universities and public transportation.',
    category: 'Apartment',
    price: 12000,
    rooms: 1,
    bed: 1,
    bathroom: 1,
    location: {
      barangay: 'Sampaloc',
      city: 'Manila',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image13.1.jpg',
      'storage/property_seeder/seeder_image13.2.jpg',
      'storage/property_seeder/seeder_image13.3.jpg',
      'storage/property_seeder/seeder_image13.4.jpg'
    ]
  },
  {
    item_name: 'Premium 4BR House in Alabang',
    description: 'Spacious 4-bedroom house in exclusive subdivision. Features large living and dining areas, maid\'s room, 2-car garage, and landscaped garden. Perfect for large families. Close to schools and commercial centers.',
    category: 'Apartment',
    price: 50000,
    rooms: 4,
    bed: 4,
    bathroom: 3,
    location: {
      barangay: 'Ayala Alabang',
      city: 'Muntinlupa',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image14.1.jpg',
      'storage/property_seeder/seeder_image14.2.jpg',
      'storage/property_seeder/seeder_image14.3.jpg'
    ]
  },
  {
    item_name: 'Family-Friendly 3BR Duplex in Parañaque',
    description: 'Well-maintained 3-bedroom duplex with balcony and parking. Features spacious bedrooms, modern kitchen, and living area. Located in a family-oriented community near airport and malls.',
    category: 'Apartment',
    price: 32000,
    rooms: 3,
    bed: 3,
    bathroom: 2,
    location: {
      barangay: 'BF Homes',
      city: 'Parañaque',
      province: 'Metro Manila'
    },
    pictures: [
      'storage/property_seeder/seeder_image15.1.jpg',
      'storage/property_seeder/seeder_image15.2.jpg',
      'storage/property_seeder/seeder_image15.3.jpg',
      'storage/property_seeder/seeder_image15.4.jpg'
    ]
  }
];

const seedProperties = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB...');

    // Find users to assign as property owners
    const users = await User.find({ userType: { $in: ['rentor', 'admin'] } });
    
    if (users.length === 0) {
      console.error('❌ No users found! Please run userSeeder first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users to assign as property owners...`);

    // Clear existing properties
    await Property.deleteMany({});
    console.log('Cleared existing properties...');

    // Assign properties to users (distribute evenly)
    const propertiesWithOwners = properties.map((property, index) => ({
      ...property,
      uploadedBy: users[index % users.length]._id
    }));

    // Insert seed data
    const createdProperties = await Property.insertMany(propertiesWithOwners);
    console.log(`✅ Successfully seeded ${createdProperties.length} properties!`);

    // Display created properties
    console.log('\n📋 Created Properties:');
    for (const property of createdProperties) {
      const owner = await User.findById(property.uploadedBy);
      console.log(`• ${property.item_name} - ₱${property.price}/month (${property.category})`);
      console.log(`  Owner: ${owner.fullName}`);
      console.log(`  Location: ${property.location.barangay}, ${property.location.city}, ${property.location.province}`);
      console.log('');
    }

    console.log('\n✨ Property seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding properties:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
seedProperties();
