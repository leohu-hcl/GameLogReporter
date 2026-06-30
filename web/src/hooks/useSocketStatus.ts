'use client';

import { useEffect, useState } from 'react';
import { initSocket, disconnectSocket } from '@/config/socket-config';

/**
 * 建立 Socket.io 连接并跟踪实时连接状态。
 * 用 accessToken 鉴权；登出（token 消失）时断开。
 * 让 Header 的"系统在线"指示真实反映连接，而非写死。
 */
export function useSocketStatus(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const socket = initSocket(token);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // 若复用了已连接的 socket，connect 事件不会再触发，需补一次同步
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
    };
  }, []);

  return connected;
}

export default useSocketStatus;
