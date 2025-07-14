import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://hatim:PgyQj0ypkWmxRcsX@cluster0.ltmj89q.mongodb.net/avolship?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB!');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();