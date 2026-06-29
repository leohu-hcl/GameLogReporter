import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { setupLogger } from '../config/logger';
import * as logService from './LogService';
import { Session } from '../models/Session';
import { isAllowedOrigin } from '../config/cors';

const logger = setupLogger();
let io: SocketServer | null = null;

export function setupWebSocket(server: HttpServer): void {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // 实时日志上报
    socket.on('log:realtime', async (data) => {
      try {
        const log = await logService.createLog(data);
        // 广播给所有连接的客户端（除了发送者）
        socket.broadcast.emit('log:new', log);
        socket.emit('log:ack', { success: true, logId: log._id });
      } catch (error) {
        logger.error('WebSocket log error:', error);
        socket.emit('log:error', { error: 'Failed to save log' });
      }
    });

    // 订阅特定游戏的日志
    socket.on('subscribe:game', (gameId: string) => {
      socket.join(`game:${gameId}`);
      logger.info(`Socket ${socket.id} subscribed to game ${gameId}`);
    });

    // 取消订阅
    socket.on('unsubscribe:game', (gameId: string) => {
      socket.leave(`game:${gameId}`);
      logger.info(`Socket ${socket.id} unsubscribed from game ${gameId}`);
    });

    // 订阅特定会话的日志
    socket.on('subscribe:session', (sessionId: string) => {
      // 获取会话对应的游戏ID
      Session.findOne({ sessionId }).select('gameId').then(session => {
        if (session && session.gameId) {
          socket.join(`game:${session.gameId}`);
          logger.info(`Socket ${socket.id} subscribed to session ${sessionId} (game: ${session.gameId})`);
        }
      }).catch(err => {
        logger.error(`Error subscribing to session ${sessionId}:`, err);
      });
    });

    // 取消订阅会话
    socket.on('unsubscribe:session', (sessionId: string) => {
      // 获取会话对应的游戏ID
      Session.findOne({ sessionId }).select('gameId').then(session => {
        if (session && session.gameId) {
          socket.leave(`game:${session.gameId}`);
          logger.info(`Socket ${socket.id} unsubscribed from session ${sessionId} (game: ${session.gameId})`);
        }
      }).catch(err => {
        logger.error(`Error unsubscribing from session ${sessionId}:`, err);
      });
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  logger.info('WebSocket server initialized');
}

// 向特定游戏房间广播新日志
export async function broadcastLogToGame(gameId: string, log: any): Promise<void> {
  if (io) {
    io.to(`game:${gameId}`).emit('log:new', log);
  }
}

// 根据会话ID向特定游戏房间广播新日志
export async function broadcastLogToSession(sessionId: string, log: any): Promise<void> {
  if (io) {
    try {
      // 根据会话ID获取游戏ID
      const session = await Session.findOne({ sessionId }).select('gameId').lean();
      if (session && session.gameId) {
        io.to(`game:${session.gameId}`).emit('log:new', log);
      }
    } catch (error) {
      console.error('Error broadcasting log to session:', error);
    }
  }
}

// 向所有客户端广播统计更新
export function broadcastStatsUpdate(stats: any): void {
  if (io) {
    io.emit('stats:update', stats);
  }
}

export function getIO(): SocketServer | null {
  return io;
}
