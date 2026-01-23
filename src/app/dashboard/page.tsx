'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LOG_LEVEL_LABELS, LOG_LEVEL_COLORS } from '@/components/logs/LogsTable';
import { useLogStats } from '@/hooks/useLogsQueries';
import { useMemo } from 'react';

/**
 * 仪表板页面
 */
export default function DashboardPage() {
  const router = useRouter();
  
  // 计算今日时间范围 (00:00:00 到现在)
  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString()
    };
  }, []);
  
  // 计算7日时间范围
  const last7Days = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString()
    };
  }, []);
  
  // 获取今日统计数据
  const { data: stats, isLoading } = useLogStats(today);
  
  // 获取7日统计数据
  const { data: last7DaysStats, isLoading: isLoadingLast7Days } = useLogStats(last7Days);

  // 按级别分类的日志数据 (使用7日数据)
  const logLevelData = useMemo(() => {
    if (!last7DaysStats?.byLevel) return [];
    
    // 定义日志级别的排序顺序（从严重到轻微）
    const levelOrder = ['critical', 'error', 'warning', 'info', 'debug'];
    
    return Object.entries(last7DaysStats.byLevel)
      .sort(([levelA], [levelB]) => {
        const indexA = levelOrder.indexOf(levelA);
        const indexB = levelOrder.indexOf(levelB);
        // 如果在定义的顺序中找不到，放到最后
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      })
      .map(([level, count]) => ({
          level,
          count,
          label: LOG_LEVEL_LABELS[level] || level,
          color: LOG_LEVEL_COLORS[level] || 'bg-gray-100 text-gray-800',
        }))
  }, [last7DaysStats]);

  if (isLoading || isLoadingLast7Days) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner />
        </Layout>
      </ProtectedRoute>
    );
  }

  const handleLevelClick = (level: string) => {
    router.push(`/logs?level=${level}`);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
            <p className="text-gray-600">欢迎回来！这是您的日志管理概览</p>
          </div>

          {/* 统计卡片 */}
          <DashboardStats stats={stats} />

          {/* 按级别统计的日志 */}
          <Card>
            <CardHeader>
              <CardTitle>日志级别统计</CardTitle>
              <CardDescription>过去7天按严重程度分类的日志总数 (点击可查看相应日志)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logLevelData.length > 0 ? (
                  logLevelData.map((item) => (
                    <button
                      key={item.level}
                      onClick={() => handleLevelClick(item.level)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${item.color}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-2xl font-bold">{item.count}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
