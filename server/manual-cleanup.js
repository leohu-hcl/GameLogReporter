require('dotenv').config();
const { connectDatabase } = require('./dist/config/database');
const { SessionService } = require('./dist/services/SessionService');

(async () => {
  try {
    await connectDatabase();
    console.log('已连接到数据库');
    
    // 关闭24小时内无活动的会话
    const result = await SessionService.closeInactiveSessions(0);
    console.log(`已关闭 ${result.closedCount} 个不活跃的会话`);
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();
