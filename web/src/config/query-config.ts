import { QueryClient, keepPreviousData } from '@tanstack/react-query';

/**
 * React Query 全局配置
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 10, // 10 分钟
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 翻页/刷新时保留上一页数据，避免列表整页闪成 spinner（isLoading 仅首屏为 true）
      placeholderData: keepPreviousData,
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export default queryClient;
