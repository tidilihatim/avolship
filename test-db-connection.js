// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing database connection from frontend environment...');
  console.log('MONGODB_URI:', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':****@'));
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test creating a user
    const User = require('./src/lib/db/models/User').default;
    const testUser = new User({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'SELLER',
      status: 'PENDING',
      phone: '1234567890',
      country: 'Test Country'
    });
    
    await testUser.validate();
    console.log('✅ User model validation passed');
    
    await mongoose.disconnect();
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Connection or validation failed:', error.message);
    if (error.message.includes('Authentication failed')) {
      console.error('\nAuthentication issue detected. Please check:');
      console.error('1. Username and password in the connection string');
      console.error('2. Database user has correct permissions');
      console.error('3. IP address is whitelisted in MongoDB Atlas');
    }
  }
}

testConnection();