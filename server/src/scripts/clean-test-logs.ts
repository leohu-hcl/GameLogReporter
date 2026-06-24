import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupLogger } from '../config/logger';

dotenv.config();

const logger = setupLogger();

async function cleanTestLogs() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelog-reporter';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // 导入 Log 模型
    const { Log } = await import('../models/Log');

    // 查看当前所有日志
    const allLogs = await Log.find({}).select('logId message');
    logger.info(`Total logs in database: ${allLogs.length}`);
    allLogs.forEach((log, index) => {
      logger.info(`[${index + 1}] ${log.logId}: ${log.message.substring(0, 50)}...`);
    });

    // 删除测试日志
    const result = await Log.deleteMany({
      logId: {
        $regex: '^test-log-'
      }
    });

    logger.info(`Deleted ${result.deletedCount} test logs`);

    // 显示剩余的真实日志
    const realLogs = await Log.find({}).select('logId message createdAt');
    logger.info(`Remaining real logs: ${realLogs.length}`);
    realLogs.forEach((log, index) => {
      logger.info(`[${index + 1}] ${log.logId}: ${log.message}`);
      logger.info(`   Created: ${log.createdAt}`);
    });

    await mongoose.connection.close();
    logger.info('Database cleanup completed');
  } catch (error) {
    logger.error('Error cleaning test logs:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanTestLogs();
