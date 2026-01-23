import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 告警 Hooks
 * TODO: 实现告警服务
 */

interface Alert {
  _id: string;
  name: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  remark?: string;
  relatedLogs: string[];
  createdAt: string;
  updatedAt: string;
}

interface AlertFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  startDate?: number;
  endDate?: number;
}

/**
 * 获取告警列表
 */
export function useAlertsList(filters?: AlertFilters) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      // TODO: 实现实际的 API 调用
      return {
        items: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        totalPages: 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取单个告警详情
 */
export function useAlertDetail(alertId: string) {
  return useQuery({
    queryKey: ['alerts', alertId],
    queryFn: async () => {
      // TODO: 实现实际的 API 调用
      return {} as Alert;
    },
    enabled: !!alertId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * 更新告警状态
 */
export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, status }: { alertId: string; status: string }) => {
      // TODO: 实现实际的 API 调用
      return { alertId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * 添加告警备注
 */
export function useAddAlertRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, remark }: { alertId: string; remark: string }) => {
      // TODO: 实现实际的 API 调用
      return { alertId, remark };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
