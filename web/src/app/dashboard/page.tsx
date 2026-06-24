'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  LOG_LEVEL_LABELS,
  LOG_LEVEL_COLORS,
  LOG_TYPE_LABELS,
} from '@/components/logs/LogsTable';
import { useLogStats } from '@/hooks/useLogsQueries';
import { useMemo } from 'react';

// 级别 → 图表填充色（CSS 变量，自动跟随主题）
const LEVEL_FILL: Record<string, string> = {
  critical: 'var(--destructive)',
  error: 'var(--destructive)',
  warning: 'var(--warning)',
  info: 'var(--info)',
  debug: 'var(--muted-foreground)',
};

// 类型 → 图表填充色
const TYPE_FILL: Record<string, string> = {
  performance: 'var(--success)',
  user_action: 'var(--info)',
  system_log: 'var(--warning)',
  custom: 'var(--chart-4)',
};

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
          color: LOG_LEVEL_COLORS[level] || 'bg-muted text-muted-foreground border-border',
        }))
  }, [last7DaysStats]);

  // 级别分布图数据
  const levelChartData = useMemo(
    () =>
      logLevelData.map((item) => ({
        key: item.level,
        label: item.label,
        value: item.count,
        color: LEVEL_FILL[item.level] || 'var(--muted-foreground)',
      })),
    [logLevelData]
  );

  // 类型分布图数据
  const typeChartData = useMemo(() => {
    if (!last7DaysStats?.byType) return [];
    return Object.entries(last7DaysStats.byType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        key: type,
        label: LOG_TYPE_LABELS[type] || type,
        value: count,
        color: TYPE_FILL[type] || 'var(--chart-4)',
      }));
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

  const handleTypeClick = (logType: string) => {
    router.push(`/logs?logType=${logType}`);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <PageHeader 
            title="仪表板" 
            description="欢迎回来！这是您的日志管理概览"
          />

          {/* 统计卡片 */}
          <DashboardStats stats={stats} />

          {/* 分布图表 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 级别分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">日志级别分布</CardTitle>
                <CardDescription>过去 7 天按严重程度 (点击柱条查看相应日志)</CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart data={levelChartData} onBarClick={handleLevelClick} />
              </CardContent>
            </Card>

            {/* 类型分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">日志类型分布</CardTitle>
                <CardDescription>过去 7 天按日志类型 (点击柱条查看相应日志)</CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart data={typeChartData} onBarClick={handleTypeClick} />
              </CardContent>
            </Card>
          </div>

          {/* 按级别统计的明细 */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display tracking-wide">级别明细</CardTitle>
              <CardDescription>过去 7 天各级别日志总数 (点击可查看相应日志)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {logLevelData.length > 0 ? (
                  logLevelData.map((item, index) => (
                    <button
                      key={item.level}
                      onClick={() => handleLevelClick(item.level)}
                      className="animate-rise flex w-full cursor-pointer items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${item.color}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="font-display text-2xl font-bold tabular-nums text-foreground">{item.count}</span>
                    </button>
                  ))
                ) : (
                  <p className="col-span-full py-8 text-center text-muted-foreground">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
