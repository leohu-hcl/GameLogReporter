/**
 * 设备 API 服务
 */

import { apiClient } from './client';
import { Device, Session } from '@/types';

export interface DeviceWithSessions {
  device: Device;
  sessions: (Session & { logCount: number; errorCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeviceStats {
  device: Device;
  stats: {
    sessionCount: number;
    activeSessions: number;
    logCount: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface DevicesSummary {
  totalDevices: number;
  activeDevices: number;
  totalSessions: number;
  activeSessions: number;
  totalLogs: number;
  topDevices: (Device & { sessionCount: number })[];
}

export interface DevicesResponse {
  devices: (Device & { sessionCount: number; logCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const deviceService = {
  /**
   * 获取所有设备列表
   */
  getAllDevices: async (page = 1, limit = 10, filters?: any): Promise<DevicesResponse> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const response = await apiClient.get<{
      success: boolean;
      data: DevicesResponse;
    }>(`/devices?${params.toString()}`);
    return response.data;
  },

  /**
   * 获取单个设备详情及其会话
   */
  getDeviceWithSessions: async (deviceId: string, page = 1, limit = 10): Promise<DeviceWithSessions> => {
    const response = await apiClient.get<{
      success: boolean;
      data: DeviceWithSessions;
    }>(`/devices/${deviceId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * 获取设备统计信息
   */
  getDeviceStats: async (deviceId: string): Promise<DeviceStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: DeviceStats;
    }>(`/devices/${deviceId}/stats`);
    return response.data;
  },

  /**
   * 获取所有设备统计摘要
   */
  getDevicesSummary: async (): Promise<DevicesSummary> => {
    const response = await apiClient.get<{
      success: boolean;
      data: DevicesSummary;
    }>('/devices/summary');
    return response.data;
  },

  /**
   * 更新设备信息
   */
  updateDevice: async (deviceId: string, data: Partial<Device>): Promise<Device> => {
    const response = await apiClient.put<{
      success: boolean;
      data: Device;
    }>(`/devices/${deviceId}`, data);
    return response.data;
  },

  /**
   * 删除设备及其所有数据
   */
  deleteDevice: async (deviceId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{
      success: boolean;
      data: { message: string };
    }>(`/devices/${deviceId}`);
    return response.data;
  },

  /**
   * 获取设备列表（用于下拉框）
   */
  getDeviceList: async (): Promise<Array<{ id: string; label: string; value: string }>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Array<{ id: string; label: string; value: string }>;
    }>('/devices/list');
    return response.data;
  },
};
