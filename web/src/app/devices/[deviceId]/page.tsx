'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { InfoCard } from '@/components/common/InfoCard';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useDeviceWithSessions } from '@/hooks/useDeviceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChevronLeft, ExternalLink, Download, Smartphone, Activity, BarChart3, FileText } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

/**
 * 设备详情页面
 */
export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.deviceId as string;
  const { getPageSize } = useSettings();
  const pageSize = getPageSize('deviceSessions');

  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useDeviceWithSessions(deviceId, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const handleDownloadSessions = () => {
    if (!data?.sessions) return;

    const sessionsJson = JSON.stringify(data.sessions, null, 2);
    const blob = new Blob([sessionsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-${deviceId}-sessions.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  if (error || !data?.device) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              返回
            </Button>

            <div className="flex items-center justify-center min-h-96">
              <Card className="w-full max-w-md border-destructive/30 bg-destructive/10">
                <CardHeader>
                  <CardTitle className="text-destructive">设备不存在</CardTitle>
                  <CardDescription className="text-destructive">
                    {error?.message || '您要查看的设备已不存在或已被删除'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium mb-1">可能的原因：</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>设备ID 输入错误</li>
                      <li>设备已被管理员删除</li>
                      <li>设备从未连接过应用</li>
                      <li>设备数据已过期或被清空</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">设备ID：</span>
                      <code className="ml-2 inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                        {deviceId}
                      </code>
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      返回上一页
                    </Button>
                    <Button
                      onClick={() => router.push('/devices')}
                      className="flex-1"
                    >
                      查看所有设备
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const { device, sessions, pagination } = data;
  const uptimeDays = Math.floor(
    (new Date(device.lastSeen).getTime() - new Date(device.firstSeen).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <PageHeader
            title={device.deviceModel}
            description={`${new Date(device.firstSeen).toLocaleString('zh-CN')} 首次连接`}
          >
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              返回
            </Button>
          </PageHeader>

          <InfoCard
            title="设备信息"
            columns={3}
            items={[
              {
                label: '设备ID',
                value: (
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                    {device.deviceId}
                  </code>
                ),
              },
              {
                label: '平台',
                value: <Badge variant="outline">{device.platform}</Badge>,
              },
              {
                label: '活跃状态',
                value: device.isActive ? (
                  <Badge variant="default">活跃</Badge>
                ) : (
                  <Badge variant="secondary">离线</Badge>
                ),
              },
            ]}
          />

          <InfoCard
            columns={4}
            items={[
              { label: 'OS版本', value: device.osVersion || '-' },
              { label: 'Unity版本', value: device.unityVersion || '-' },
              { label: '首次连接', value: new Date(device.firstSeen).toLocaleString('zh-CN') },
              { label: '最后连接', value: new Date(device.lastSeen).toLocaleString('zh-CN') },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard
              title="运行天数"
              value={uptimeDays}
              icon={Activity}
              iconColor="text-primary"
              description="天"
            />
            <StatCard
              title="会话总数"
              value={pagination.total}
              icon={BarChart3}
              iconColor="text-info"
            />
            <StatCard
              title="总日志数"
              value={sessions.reduce((sum, s) => sum + (s.logCount || 0), 0)}
              icon={FileText}
              iconColor="text-warning"
            />
          </div>

          {/* 会话活动图 — 当前页各会话日志量，有错误的会话标红 */}
          {sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">会话活动</CardTitle>
                <CardDescription>
                  当前页各会话的日志量 (含错误的会话以红色标记，点击柱条查看会话)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  height={Math.max(160, sessions.length * 34)}
                  onBarClick={(key) => router.push(`/sessions/${key}`)}
                  data={sessions.map((s) => ({
                    key: s.sessionId,
                    label: s.sessionId.substring(0, 8),
                    value: s.logCount || 0,
                    color:
                      s.errorCount && s.errorCount > 0
                        ? 'var(--destructive)'
                        : 'var(--primary)',
                  }))}
                />
              </CardContent>
            </Card>
          )}

          <DataTable
            title="设备会话"
            description={`共 ${pagination.total} 个会话，第 ${page} / ${pagination.totalPages} 页`}
            data={sessions}
            keyExtractor={(session) => session.sessionId}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSessions}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                下载
              </Button>
            }
            emptyState={
              <EmptyState
                icon={Smartphone}
                title="暂无会话"
                description="该设备还没有任何会话记录"
              />
            }
            columns={[
              {
                key: 'sessionId',
                label: '会话ID',
                render: (session) => (
                  <button
                    className="text-primary hover:underline font-mono text-xs"
                    onClick={() => router.push(`/sessions/${session.sessionId}`)}
                    title="查看会话详情"
                  >
                    {session.sessionId?.substring(0, 16)}...
                  </button>
                ),
              },
              {
                key: 'startTime',
                label: '开始时间',
                render: (session) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.startTime).toLocaleString('zh-CN')}
                  </span>
                ),
              },
              {
                key: 'status',
                label: '状态',
                render: (session) => (
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                    {session.status === 'active' ? '进行中' : '已结束'}
                  </Badge>
                ),
              },
              {
                key: 'logCount',
                label: '日志数',
                align: 'center',
                render: (session) => session.logCount || 0,
              },
              {
                key: 'errorCount',
                label: '错误数',
                align: 'center',
                render: (session) =>
                  session.errorCount && session.errorCount > 0 ? (
                    <Badge variant="destructive">{session.errorCount}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  ),
              },
              {
                key: 'actions',
                label: '操作',
                align: 'center',
                render: (session) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/sessions/${session.sessionId}`)}
                    title="查看会话详情"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ),
              },
            ]}
          />

          {pagination.totalPages > 1 && (
            <div className="mt-2">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
