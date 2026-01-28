import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Log } from './src/models/Log';

dotenv.config();

async function testConnection() {
  try {
    console.log('尝试连接到数据库...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelog-reporter';
    console.log('使用连接字符串: ' + mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('数据库连接成功!');

    // 检查集合是否存在以及文档数量
    const count = await Log.countDocuments();
    console.log('logs 集合中的文档数量: ' + count);

    if (count > 0) {
      console.log('最近的5个日志记录:');
      const logs = await Log.find().sort({ createdAt: -1 }).limit(5);
      logs.forEach(log => {
        console.log('- ' + log.timestamp + ': ' + log.message + ' (sessionId: ' + log.sessionId + ', logType: ' + log.logType + ', level: ' + log.level + ')');
      });
      
      console.log('\n查找来自 Unity 客户端的测试日志:');
      const unityLogs = await Log.find({ message: { $regex: '测试日志上报|性能日志|Test', $options: 'i' } }).sort({ createdAt: -1 }).limit(5);
      unityLogs.forEach(log => {
        console.log('- ' + log.timestamp + ': ' + log.message.substring(0, 60) + '... (sessionId: ' + log.sessionId + ', logType: ' + log.logType + ', level: ' + log.level + ')');
      });
    }

    await mongoose.connection.close();
    console.log('数据库连接已关闭.');
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

testConnection();