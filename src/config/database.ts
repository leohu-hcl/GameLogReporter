import mongoose from 'mongoose';
import { setupLogger } from './logger';

const logger = setupLogger();

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelog-reporter';
    
    await mongoose.connect(mongoUri);
    
    logger.info('MongoDB connected successfully');

    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
