const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  
  // Detailed error messages for debugging
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is not set. ' +
      'Please configure it with your MongoDB connection string. ' +
      'Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority'
    );
  }
  
  if (uri.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using localhost MongoDB in production! This will fail.');
    console.warn('Please set MONGODB_URI to a MongoDB Atlas connection string.');
  }
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('Check your MongoDB username and password in MONGODB_URI');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('Check your MongoDB host/cluster name in MONGODB_URI');
    } else if (error.message.includes('timeout')) {
      console.error('MongoDB connection timeout. Check your firewall rules in MongoDB Atlas.');
      console.error('Whitelist 0.0.0.0/0 or your specific Render IP.');
    }
    throw error;
  }
}

module.exports = { connectDb };
