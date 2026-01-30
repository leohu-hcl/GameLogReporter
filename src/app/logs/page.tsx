'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { LogsTable } from '@/components/logs/LogsTable';
import { LogFilters } from '@/types';

/**
 * 日志列表页面内容
 */
function LogsPageContent() {
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
    <div className="space-y-6">
      <PageHeader title="日志" description="查看和管理所有游戏日志" />

      <LogsTable initialFilters={initialFilters} />
    </div>
  );
}

/**
 * 日志列表页面
 */
export default function LogsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<div>加载中...</div>}>
          <LogsPageContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
