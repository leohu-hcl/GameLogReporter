import io, { Socket } from 'socket.io-client';
import { config } from './env';

/**
 * Socket.io 配置
 */
const socketConfig = {
  url: config.socketUrl,
  options: {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  },
};

let socket: Socket | null = null;

/**
 * 初始化 Socket.io 连接
 */
export function initSocket(token?: string): Socket {
  if (socket) {
    return socket;
  }

  const options = {
    ...socketConfig.options,
    auth: token ? { token } : undefined,
  };

  socket = io(socketConfig.url, options);

  socket.on('connect', () => {
    console.log('[Socket.io] Connected');
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] Disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket.io] Connection error:', error);
  });

  return socket;
}

/**
 * 获取 Socket 实例
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * 断开 Socket 连接
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
};
