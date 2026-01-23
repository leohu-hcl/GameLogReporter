import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logService } from '@/api/logs';
import { Log, LogFilters, LogStats } from '@/types';
import { PaginatedResponse } from '@/types/common';

/**
 * 获取日志列表
 */
export function useLogsList(filters?: LogFilters) {
  return useQuery({
    queryKey: ['logs', filters],
    queryFn: async () => {
      const defaultFilters: LogFilters = {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        ...filters,
      };
      const response = await logService.getLogs(defaultFilters);
      // 转换响应格式，将 logs 转为 items
      return {
        items: response.logs,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      } as PaginatedResponse<Log>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取单个日志详情
 */
export function useLogDetail(logId: string) {
  return useQuery({
    queryKey: ['logs', logId],
    queryFn: async () => {
      return await logService.getLogDetail(logId);
    },
    enabled: !!logId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * 搜索日志
 */
export function useLogsSearch(query: string, filters?: LogFilters) {
  return useQuery({
    queryKey: ['logs', 'search', query, filters],
    queryFn: async () => {
      const defaultFilters: LogFilters = {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        search: query,
        ...filters,
      };
      const response = await logService.searchLogs(query, defaultFilters);
      // 转换响应格式，将 logs 转为 items
      return {
        items: response.logs,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      } as PaginatedResponse<Log>;
    },
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * 获取日志统计
 */
export function useLogStats(params?: { sessionId?: string; startTime?: string; endTime?: string }) {
  return useQuery({
    queryKey: ['logs', 'stats', params],
    queryFn: async () => {
      return await logService.getLogStats(params);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - prevent excessive API calls
  });
}

/**
 * 导出日志
 */
export function useExportLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filters: LogFilters) => {
      return await logService.exportLogs(filters);
    },
    onSuccess: () => {
      // 刷新日志列表
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

/**
 * 检查导出状态
 */
export function useExportStatus(jobId: string) {
  return useQuery({
    queryKey: ['logs', 'export', jobId],
    queryFn: async () => {
      return await logService.checkExportStatus(jobId);
    },
    enabled: !!jobId,
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
  });
}
