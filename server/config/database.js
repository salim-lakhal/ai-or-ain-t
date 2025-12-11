import mongoose from 'mongoose';

export const connectDB = async (MONGO_URI, NODE_ENV) => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log('✅ MongoDB Connected to AIorAINT');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    // Don't exit in development to allow retry
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
export const setupGracefulShutdown = () => {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
};
