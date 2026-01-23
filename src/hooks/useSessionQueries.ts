import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '@/api/sessions';
import { Session, SessionWithLogs, SessionsByDevice, SessionStats } from '@/types';

/**
 * 获取单个会话详情及其所有日志
 */
export function useSessionWithLogs(sessionId: string | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['sessions', sessionId, page, limit],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      return await sessionService.getSessionWithLogs(sessionId, page, limit);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取设备的所有会话
 */
export function useSessionsByDevice(deviceId: string | null, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['sessions', 'device', deviceId, page, limit],
    queryFn: async () => {
      if (!deviceId) throw new Error('Device ID is required');
      return await sessionService.getSessionsByDevice(deviceId, page, limit);
    },
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取设备最近的会话
 */
export function useRecentSessions(deviceId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['sessions', 'recent', deviceId, limit],
    queryFn: async () => {
      if (!deviceId) throw new Error('Device ID is required');
      return await sessionService.getRecentSessions(deviceId, limit);
    },
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取会话统计信息
 */
export function useSessionStats(deviceId?: string | null) {
  return useQuery({
    queryKey: ['sessions', 'stats', deviceId],
    queryFn: async () => {
      return await sessionService.getSessionStats(deviceId || undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 更新会话 (mutation)
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: Partial<Session> }) => {
      return await sessionService.updateSession(sessionId, data);
    },
    onSuccess: (data) => {
      // 失效相关的查询
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/**
 * 结束会话 (mutation)
 */
export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await sessionService.endSession(sessionId);
    },
    onSuccess: (data) => {
      // 失效相关的查询
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/**
 * 删除会话 (mutation)
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await sessionService.deleteSession(sessionId);
    },
    onSuccess: () => {
      // 失效相关的查询
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
