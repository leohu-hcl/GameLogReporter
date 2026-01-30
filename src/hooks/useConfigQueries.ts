/**
 * 系统配置相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService, SystemConfig } from '@/api/config';

/**
 * 获取系统配置 Hook
 */
export function useSystemConfig() {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      return await configService.getSystemConfig();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 更新系统配置 Hook
 */
export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Parameters<typeof configService.updateSystemConfig>[0]) => {
      return await configService.updateSystemConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
  });
}

/**
 * 手动触发会话清理 Hook
 */
export function useTriggerSessionCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours?: number) => {
      return await configService.triggerSessionCleanup(hours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-stats'] });
    },
  });
}

/**
 * 获取系统统计 Hook
 */
export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      return await configService.getSystemStats();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
}
