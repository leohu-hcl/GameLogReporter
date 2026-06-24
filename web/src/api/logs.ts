/**
 * 日志 API 服务
 */

import { apiClient } from './client';
import { Log, LogFilters, LogsResponse, LogStats } from '@/types';

export const logService = {
  /**
   * 获取日志列表
   */
  getLogs: async (filters: LogFilters): Promise<LogsResponse['data']> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await apiClient.get<LogsResponse>(`/logs?${params.toString()}`);
    return response.data;
  },

  /**
   * 获取日志详情
   */
  getLogDetail: async (id: string): Promise<Log> => {
    const response = await apiClient.get<{ success: boolean; data: Log }>(`/logs/${id}`);
    return response.data;
  },

  /**
   * 搜索日志
   */
  searchLogs: async (query: string, filters?: Partial<LogFilters>): Promise<LogsResponse['data']> => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<LogsResponse>(`/logs/search?${params.toString()}`);
    return response.data;
  },

  /**
   * 获取日志统计
   */
  getLogStats: async (params?: { sessionId?: string; startTime?: string; endTime?: string }): Promise<LogStats> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<{ success: boolean; data: LogStats }>(`/logs/stats?${query.toString()}`);
    return response.data;
  },

  /**
   * 导出日志
   */
  exportLogs: async (filters: LogFilters): Promise<{ jobId: string; status: string }> => {
    return apiClient.post('/logs/export', filters);
  },

  /**
   * 检查导出状态
   */
  checkExportStatus: async (jobId: string): Promise<{ status: string; downloadUrl?: string }> => {
    return apiClient.get(`/logs/export/${jobId}`);
  },
};

export default logService;
