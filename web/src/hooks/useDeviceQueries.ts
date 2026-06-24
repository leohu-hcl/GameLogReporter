import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '@/api/devices';
import { Device } from '@/types';

/**
 * 获取所有设备列表
 */
export function useDevicesList(page = 1, limit = 10, filters?: any) {
  return useQuery({
    queryKey: ['devices', page, limit, filters],
    queryFn: async () => {
      return await deviceService.getAllDevices(page, limit, filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取单个设备详情及其会话
 */
export function useDeviceWithSessions(deviceId: string | null, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['devices', deviceId, 'sessions', page, limit],
    queryFn: async () => {
      if (!deviceId) throw new Error('Device ID is required');
      return await deviceService.getDeviceWithSessions(deviceId, page, limit);
    },
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取设备统计信息
 */
export function useDeviceStats(deviceId: string | null) {
  return useQuery({
    queryKey: ['devices', deviceId, 'stats'],
    queryFn: async () => {
      if (!deviceId) throw new Error('Device ID is required');
      return await deviceService.getDeviceStats(deviceId);
    },
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取所有设备统计摘要
 */
export function useDevicesSummary() {
  return useQuery({
    queryKey: ['devices', 'summary'],
    queryFn: async () => {
      return await deviceService.getDevicesSummary();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取设备列表（用于下拉框）
 */
export function useDeviceList() {
  return useQuery({
    queryKey: ['devices', 'list'],
    queryFn: async () => {
      return await deviceService.getDeviceList();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * 更新设备 (mutation)
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId, data }: { deviceId: string; data: Partial<Device> }) => {
      return await deviceService.updateDevice(deviceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

/**
 * 删除设备 (mutation)
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      return await deviceService.deleteDevice(deviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
