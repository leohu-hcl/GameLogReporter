/**
 * 会话 API 服务
 */

import { apiClient } from './client';
import {
  Session,
  SessionWithLogs,
  SessionsByDevice,
  SessionStats,
} from '@/types';

export const sessionService = {
  /**
   * 获取单个会话详情及其所有日志
   */
  getSessionWithLogs: async (
    sessionId: string,
    page = 1,
    limit = 20
  ): Promise<SessionWithLogs> => {
    const response = await apiClient.get<{ success: boolean; data: SessionWithLogs }>(
      `/sessions/${sessionId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * 获取设备的所有会话
   */
  getSessionsByDevice: async (
    deviceId: string,
    page = 1,
    limit = 10
  ): Promise<SessionsByDevice> => {
    const response = await apiClient.get<{
      success: boolean;
      data: SessionsByDevice;
    }>(`/sessions/device/${deviceId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * 获取设备最近的会话
   */
  getRecentSessions: async (deviceId: string, limit = 5): Promise<Session[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Session[];
    }>(`/sessions/device/${deviceId}/recent?limit=${limit}`);
    return response.data;
  },

  /**
   * 获取会话统计信息
   */
  getSessionStats: async (deviceId?: string): Promise<SessionStats> => {
    const params = deviceId ? `?deviceId=${deviceId}` : '';
    const response = await apiClient.get<{
      success: boolean;
      data: SessionStats;
    }>(`/sessions/stats${params}`);
    return response.data;
  },

  /**
   * 更新会话
   */
  updateSession: async (sessionId: string, data: Partial<Session>): Promise<Session> => {
    const response = await apiClient.put<{
      success: boolean;
      data: Session;
    }>(`/sessions/${sessionId}`, data);
    return response.data;
  },

  /**
   * 结束会话
   */
  endSession: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.post<{
      success: boolean;
      data: Session;
    }>(`/sessions/${sessionId}/end`);
    return response.data;
  },

  /**
   * 删除会话及其所有日志
   */
  deleteSession: async (sessionId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{
      success: boolean;
      data: { message: string };
    }>(`/sessions/${sessionId}`);
    return response.data;
  },
};
