'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusDonut } from '@/components/dashboard/StatusDonut';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useDevicesList } from '@/hooks/useDeviceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ExternalLink, Smartphone, Activity, BarChart3, FileText } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

/**
 * 设备列表页面
 */
export default function DevicesPage() {
  const router = useRouter();
  const { getPageSize } = useSettings();
  const pageSize = getPageSize('devices');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useDevicesList(page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex h-96 items-center justify-center">
            <LoadingSpinner />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <Layout>
          <Alert variant="destructive">
            <AlertDescription>
              {error?.message || '加载设备列表失败，请稍后重试'}
            </AlertDescription>
          </Alert>
        </Layout>
      </ProtectedRoute>
    );
  }

  const { devices, pagination } = data;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <PageHeader 
            title="设备管理" 
            description="查看和管理所有游戏设备"
          />

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="设备总数"
              value={pagination.total}
              icon={Smartphone}
              iconColor="text-primary"
            />
            <StatCard
              title="活跃设备"
              value={devices.filter((d) => d.isActive).length}
              icon={Activity}
              iconColor="text-success"
            />
            <StatCard
              title="平均会话数"
              value={
                devices.length > 0
                  ? (
                      devices.reduce((sum, d) => sum + (d.sessionCount || 0), 0) /
                      devices.length
                    ).toFixed(1)
                  : 0
              }
              icon={BarChart3}
              iconColor="text-info"
            />
            <StatCard
              title="总日志数"
              value={devices.reduce((sum, d) => sum + (d.logCount || 0), 0)}
              icon={FileText}
              iconColor="text-warning"
            />
          </div>

          {/* 分布环形图（基于当前页设备） */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">活跃状态</CardTitle>
                <CardDescription>当前页设备的在线 / 离线占比</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusDonut
                  centerLabel="设备"
                  data={[
                    {
                      key: 'active',
                      label: '活跃',
                      value: devices.filter((d) => d.isActive).length,
                      color: 'var(--success)',
                    },
                    {
                      key: 'inactive',
                      label: '离线',
                      value: devices.filter((d) => !d.isActive).length,
                      color: 'var(--muted-foreground)',
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">平台分布</CardTitle>
                <CardDescription>当前页设备按平台分类</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusDonut
                  centerLabel="平台"
                  centervalue={new Set(devices.map((d) => d.platform)).size}
                  data={Object.entries(
                    devices.reduce<Record<string, number>>((acc, d) => {
                      const p = d.platform || '未知';
                      acc[p] = (acc[p] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([platform, count], i) => ({
                      key: platform,
                      label: platform,
                      value: count,
                      color: `var(--chart-${(i % 5) + 1})`,
                    }))}
                />
              </CardContent>
            </Card>
          </div>

          {/* 设备列表 */}
          <Card>
            <CardHeader>
              <CardTitle>设备列表</CardTitle>
              <CardDescription>
                共 {pagination.total} 个设备，当前第 {page} 页
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <EmptyState
                  icon={Smartphone}
                  title="暂无设备数据"
                  description="还没有任何设备连接到系统"
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">设备型号</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">平台</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">OS版本</th>
                        <th className="px-4 py-3 text-center font-semibold text-foreground">会话数</th>
                        <th className="px-4 py-3 text-center font-semibold text-foreground">日志数</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">最后连接</th>
                        <th className="px-4 py-3 text-center font-semibold text-foreground">状态</th>
                        <th className="px-4 py-3 text-center font-semibold text-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => (
                        <tr key={device.deviceId} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{device.deviceModel}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{device.platform}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{device.osVersion || '-'}</td>
                          <td className="px-4 py-3 text-center text-foreground">{device.sessionCount || 0}</td>
                          <td className="px-4 py-3 text-center text-foreground">{device.logCount || 0}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(device.lastSeen).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {device.isActive ? (
                              <Badge variant="default">
                                活跃
                              </Badge>
                            ) : (
                              <Badge variant="secondary">离线</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/devices/${device.deviceId}`)}
                              title="查看详情"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 分页 */}
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pageSize}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
