import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { setupLogger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import logRoutes from './routes/logs';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import alertRoutes from './routes/alerts';
import sessionRoutes from './routes/sessions';
import deviceRoutes from './routes/devices';
import { setupWebSocket } from './services/WebSocketService';
import { startAlertMonitoring } from './services/AlertService';
import { startRealtimeStatsBroadcast } from './services/StatsService';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());
app.use(compression());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:3001', 'http://localhost:4200', 'http://127.0.0.1:3001'],
  credentials: true
}));

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(requestLogger);

// 速率限制
app.use('/api/', rateLimiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/logs', logRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/devices', deviceRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件（必须在最后）
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDatabase();
    
    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      setupLogger().info(`Server is running on port ${PORT}`);
    });

    // 设置WebSocket
    setupWebSocket(server);

    // 启动后台服务
    startAlertMonitoring(5); // 每5分钟检查一次告警
    startRealtimeStatsBroadcast(30); // 每30秒广播一次实时统计
    startInactiveSessionCleanup(60); // 每60分钟检查一次不活跃的会话

  } catch (error) {
    setupLogger().error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * 启动不活跃会话清理定时任务
 */
function startInactiveSessionCleanup(intervalMinutes: number) {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // 立即执行一次清理
  (async () => {
    try {
      setupLogger().info(`[SessionCleanup] Running initial session cleanup...`);
      const { SessionService } = await import('./services/SessionService');
      const result = await SessionService.closeInactiveSessions(24); // 检查24小时无活动的会话
      setupLogger().info(`[SessionCleanup] Initial cleanup completed, closed ${result.closedCount} sessions`);
    } catch (error) {
      setupLogger().error('[SessionCleanup] Error during initial cleanup:', error);
    }
  })();
  
  // 定时执行清理
  setInterval(async () => {
    try {
      setupLogger().info(`[SessionCleanup] Starting scheduled session cleanup task...`);
      const { SessionService } = await import('./services/SessionService');
      const result = await SessionService.closeInactiveSessions(24);
      setupLogger().info(`[SessionCleanup] Scheduled cleanup completed, closed ${result.closedCount} sessions`);
    } catch (error) {
      setupLogger().error('[SessionCleanup] Error during cleanup:', error);
    }
  }, intervalMs);

  setupLogger().info(`[SessionCleanup] Inactive session cleanup task scheduled every ${intervalMinutes} minutes`);
}

startServer();

export default app;
