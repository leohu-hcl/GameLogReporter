'use client';

import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { LogsTable } from '@/components/logs/LogsTable';
import { LogFilters } from '@/types';

/**
 * 日志列表页面
 */
export default function LogsPage() {
  const searchParams = useSearchParams();

  // 从 URL 查询参数构建初始筛选条件
  const initialFilters: LogFilters = {
    level: searchParams.get('level') || undefined,
    logType: searchParams.get('logType') || undefined,
    search: searchParams.get('search') || undefined,
    startTime: searchParams.get('startTime') || undefined,
    endTime: searchParams.get('endTime') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">日志</h1>
            <p className="text-gray-600">查看和管理所有游戏日志</p>
          </div>

          <LogsTable initialFilters={initialFilters} />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
