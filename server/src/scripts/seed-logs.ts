import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupLogger } from '../config/logger';

dotenv.config();

const logger = setupLogger();

// 动态导入 Log 模型
async function seedLogs() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelog-reporter';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // 导入 Log 模型
    const { Log } = await import('../models/Log');

    // 生成测试日志数据
    const testLogs = [
      {
        logId: `test-log-${Date.now()}-1`,
        sessionId: 'test-session-001',
        logType: 'error',
        level: 'error',
        message: '测试错误日志：数据库连接失败',
        stackTrace: `Error: Connection timeout
    at Object.<anonymous> (database.ts:45:12)
    at Module._load (internal/modules/commonjs/loader.js:219:28)
    at require (internal/modules/commonjs/loader.js:1017:13)`,
        metadata: {
          page: '/game/login',
          userId: 'user123',
          browser: 'Chrome 120.0'
        },
        tags: ['database', 'connection'],
        timestamp: new Date().toISOString()
      },
      {
        logId: `test-log-${Date.now()}-2`,
        sessionId: 'test-session-001',
        logType: 'performance',
        level: 'warning',
        message: '测试性能警告：资源加载超时',
        metadata: {
          resource: 'image.png',
          loadTime: 5200,
          threshold: 3000
        },
        tags: ['performance'],
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        logId: `test-log-${Date.now()}-3`,
        sessionId: 'test-session-002',
        logType: 'user_action',
        level: 'info',
        message: '测试用户操作：用户点击按钮',
        metadata: {
          action: 'button-click',
          buttonId: 'login-btn',
          timestamp: Date.now()
        },
        tags: ['user-action'],
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        logId: `test-log-${Date.now()}-4`,
        sessionId: 'test-session-003',
        logType: 'info',
        level: 'info',
        message: '测试信息日志：应用启动成功',
        metadata: {
          appName: 'GameLogReporter',
          version: '1.0.0',
          platform: 'web'
        },
        tags: ['startup'],
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        logId: `test-log-${Date.now()}-5`,
        sessionId: 'test-session-003',
        logType: 'error',
        level: 'critical',
        message: '测试严重错误：内存溢出',
        stackTrace: `RangeError: Maximum call stack size exceeded
    at Array.concat (<anonymous>)
    at processLogs (processor.ts:120:45)
    at handleLogs (server.ts:85:10)`,
        metadata: {
          memoryUsed: 2048,
          memoryMax: 2048,
          gc: false
        },
        tags: ['memory', 'critical'],
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ];

    // 删除旧的测试日志
    await Log.deleteMany({
      logId: {
        $regex: 'test-log-'
      }
    });
    logger.info('Cleared old test logs');

    // 插入新的测试日志
    const result = await Log.insertMany(testLogs);
    logger.info(`Created ${result.length} test logs`);

    // 显示日志详情
    result.forEach((log, index) => {
      logger.info(`[${index + 1}] Log ID: ${log._id} - ${log.message}`);
    });

    await mongoose.connection.close();
    logger.info('Test data seeding completed');
  } catch (error) {
    logger.error('Error seeding test logs:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedLogs();
