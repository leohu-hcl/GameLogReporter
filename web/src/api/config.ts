/**
 * 系统配置 API 服务
 */

import { apiClient } from './client';

export interface SystemConfig {
  sessionCleanupInterval: number; // 分钟
  inactiveSessionHours: number; // 小时
  alertCheckInterval: number;
  statsUpdateInterval: number;
  lastCleanupTime: string;
  lastAlertCheckTime: string;
}

export interface SystemStats {
  activeSessions: number;
  totalSessions: number;
  lastCleanupTime: string;
  lastAlertCheckTime: string;
}

export const configService = {
  /**
   * 获取系统配置
   */
  getSystemConfig: async (): Promise<SystemConfig> => {
    const response = await apiClient.get<{
      success: boolean;
      data: SystemConfig;
    }>('/config/system-config');
    
    return response.data;
  },

  /**
   * 更新系统配置
   */
  updateSystemConfig: async (config: {
    sessionCleanupInterval?: number;
    inactiveSessionHours?: number;
  }): Promise<SystemConfig> => {
    const response = await apiClient.put<{
      success: boolean;
      data: SystemConfig;
      note?: string;
    }>('/config/system-config', config);
    
    return response.data;
  },

  /**
   * 手动触发会话清理
   */
  triggerSessionCleanup: async (hours?: number): Promise<{
    closedCount: number;
    cleanupTime: string;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        closedCount: number;
        cleanupTime: string;
      };
    }>('/config/cleanup-inactive-sessions', { hours });
    
    return response.data;
  },

  /**
   * 获取系统统计
   */
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: SystemStats;
    }>('/config/system-stats');
    
    return response.data;
  },
};
