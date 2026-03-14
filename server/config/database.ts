import mongoose from 'mongoose';

export const connectDB = async (mongoUri: string, nodeEnv: string): Promise<void> => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log('MongoDB connected to AIorAINT');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MongoDB connection error:', message);
    if (nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

export const setupGracefulShutdown = (): void => {
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, closing MongoDB connection`);
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};
