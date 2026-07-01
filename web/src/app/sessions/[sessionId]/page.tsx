'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { InfoCard } from '@/components/common/InfoCard';
import { DataTable } from '@/components/common/DataTable';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useSessionWithLogs } from '@/hooks/useSessionQueries';
import { sessionService } from '@/api/sessions';
import { Log } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChevronLeft, Copy, Download, ExternalLink, FileText } from 'lucide-react';
import { LogDownloadDialog } from '@/components/logs/LogDownloadDialog';
import { useSettings } from '@/context/SettingsContext';

/**
 * 会话详情页面
 */
export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { getPageSize } = useSettings();
  const pageSize = getPageSize('sessionLogs');

  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const { data, isLoading, error } = useSessionWithLogs(sessionId, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const handleCopyId = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${type}-${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const performExport = async (params: { format: 'json' | 'text'; sortOrder: 'asc' | 'desc'; stackMode: 'all' | 'errors' | 'none' }) => {
    // 获取该会话的全部日志（不分页）
    const fullData = await sessionService.getSessionWithLogs(sessionId, 1, 10000);
    if (!fullData?.logs) return;

    let logsToExport = [...fullData.logs];

    // 按时间排序
    logsToExport.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp).getTime();
      const timeB = new Date(b.createdAt || b.timestamp).getTime();
      return params.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    if (params.format === 'json') {
      exportAsJSON(logsToExport, params.stackMode);
    } else {
      exportAsText(logsToExport, params.stackMode, params.sortOrder);
    }
  };

  const exportAsJSON = (logs: Log[], stackMode: 'all' | 'errors' | 'none') => {
    const processedLogs = logs.map((log) => {
      const level = (log.level || '').toLowerCase();
      const isErrorLevel = level === 'error' || level === 'critical';
      
      // 根据 stackMode 决定是否保留堆栈
      if (stackMode === 'none' || (stackMode === 'errors' && !isErrorLevel)) {
        const { stackTrace, ...rest } = log;
        return rest;
      }
      return log;
    });

    const logsJson = JSON.stringify(processedLogs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionId}-logs-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsText = (logs: Log[], stackMode: 'all' | 'errors' | 'none', sortOrder: 'asc' | 'desc') => {
    const formatDate = (iso: string) => {
      const d = new Date(iso);
      const pad = (n: number, l = 2) => String(n).padStart(l, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
    };

    const header = `Unity Editor Like Log Export\nSession: ${sessionId}\nTotal Logs: ${logs.length}\nSort: ${sortOrder === 'asc' ? '升序（从早到晚）' : '降序（从晚到早）'}\nGenerated: ${formatDate(new Date().toISOString())}\n-----------------------------\n`;

    const lines = logs.map((log) => {
      const ts = formatDate(log.createdAt || log.timestamp);
      const type = (log.logType || '').toString();
      const level = (log.level || '').toString().toLowerCase();
      const msg = (log.message || '').toString();
      
      // 根据 stackMode 决定是否包含堆栈
      const isErrorLevel = level === 'error' || level === 'critical';
      const shouldIncludeStack = stackMode === 'all' || (stackMode === 'errors' && isErrorLevel);
      const stack = shouldIncludeStack && log.stackTrace ? `\nStackTrace:\n${log.stackTrace}` : '';
      
      return `[${ts}] [${level}] [${type}] ${msg}${stack}`;
    });

    const text = header + lines.join('\n\n') + '\n';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionId}-logs-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const LOG_TYPE_LABELS: Record<string, string> = {
    performance: '性能',
    user_action: '用户操作',
    system_log: '系统日志',
    custom: '自定义',
  };

  const LOG_LEVEL_LABELS: Record<string, string> = {
    debug: '调试',
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重',
  };

  const LOG_LEVEL_COLORS: Record<string, string> = {
    debug: 'bg-muted text-muted-foreground border border-border',
    info: 'bg-info/15 text-info border border-info/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
    error: 'bg-destructive/15 text-destructive border border-destructive/30',
    critical: 'bg-destructive/15 text-destructive border border-destructive/30',
  };

  // 级别 → 图表填充色（CSS 变量，跟随主题）
  const LEVEL_FILL: Record<string, string> = {
    debug: 'var(--muted-foreground)',
    info: 'var(--info)',
    warning: 'var(--warning)',
    error: 'var(--destructive)',
    critical: 'var(--destructive)',
  };

  // 本页日志按级别聚合（用于分布图）
  const levelOrder = ['critical', 'error', 'warning', 'info', 'debug'];
  const levelChartData = (() => {
    const logs = data?.logs;
    if (!logs?.length) return [];
    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.level] = (counts[log.level] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => {
        const ia = levelOrder.indexOf(a);
        const ib = levelOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
      .map(([level, count]) => ({
        key: level,
        label: LOG_LEVEL_LABELS[level] || level,
        value: count,
        color: LEVEL_FILL[level] || 'var(--muted-foreground)',
      }));
  })();

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

  if (error || !data?.session) {
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
                  <CardTitle className="text-destructive">会话不存在</CardTitle>
                  <CardDescription className="text-destructive">
                    {error?.message || '您要查看的会话已不存在或已被删除'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium mb-1">可能的原因：</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>会话ID 输入错误</li>
                      <li>会话已被管理员删除</li>
                      <li>设备数据已被清空</li>
                      <li>会话数据已过期</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">会话ID：</span>
                      <code className="ml-2 inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                        {sessionId}
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
                      onClick={() => router.push('/logs')}
                      className="flex-1"
                    >
                      查看日志
                    </Button>
                    <Button
                      onClick={() => router.push('/devices')}
                      variant="secondary"
                      className="flex-1"
                    >
                      查看设备
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

  const { session, device, logs, pagination } = data;
  const sessionDuration = session.endTime
    ? Math.round(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
      )
    : null;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <Breadcrumb
            items={[
              { label: '设备', href: '/devices' },
              { label: device?.deviceModel || session.deviceId, href: `/devices/${session.deviceId}` },
              { label: '会话详情' },
            ]}
          />
          <PageHeader
            title="会话详情"
            description={`${new Date(session.startTime).toLocaleString('zh-CN')}`}
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
            title="会话信息"
            columns={3}
            items={[
              {
                label: '会话ID',
                value: (
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                      {session.sessionId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopyId(session.sessionId, 'session')}
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copiedId === `session-${session.sessionId}` ? 'text-success' : ''
                        }`}
                      />
                    </Button>
                  </div>
                ),
              },
              {
                label: '设备ID',
                value: (
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
                      {session.deviceId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopyId(session.deviceId, 'device')}
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copiedId === `device-${session.deviceId}` ? 'text-success' : ''
                        }`}
                      />
                    </Button>
                  </div>
                ),
              },
              {
                label: '会话状态',
                value: (
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                    {session.status === 'active' ? '进行中' : '已结束'}
                  </Badge>
                ),
              },
              {
                label: '客户端版本',
                value: session.version || '-',
              },
            ]}
          />

          <InfoCard
            columns={4}
            items={[
              { label: '开始时间', value: new Date(session.startTime).toLocaleString('zh-CN') },
              {
                label: '结束时间',
                value: session.endTime
                  ? new Date(session.endTime).toLocaleString('zh-CN')
                  : '进行中...',
              },
              {
                label: '会话时长',
                value: sessionDuration
                  ? `${Math.floor(sessionDuration / 60)}分${sessionDuration % 60}秒`
                  : '进行中...',
              },
              { label: '日志数量', value: `${pagination.total} 条` },
            ]}
          />

          {device && (
            <InfoCard
              title="设备信息"
              columns={3}
              items={[
                { label: '设备型号', value: device.deviceModel },
                { label: '平台', value: device.platform },
                { label: 'OS版本', value: device.osVersion || '-' },
                { label: 'Unity版本', value: device.unityVersion || '-' },
                { label: '首次连接', value: new Date(device.firstSeen).toLocaleString('zh-CN') },
                { label: '最后连接', value: new Date(device.lastSeen).toLocaleString('zh-CN') },
              ]}
            />
          )}

          {/* 本页日志级别分布 */}
          {levelChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wide">本页级别分布</CardTitle>
                <CardDescription>
                  当前页 {logs.length} 条日志按级别分布 (点击柱条筛选该级别日志)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  data={levelChartData}
                  onBarClick={(level) => router.push(`/logs?level=${level}`)}
                />
              </CardContent>
            </Card>
          )}

          <DataTable
            title="会话日志"
            description={`共 ${pagination.total} 条，第 ${page} / ${pagination.totalPages} 页`}
            data={logs}
            keyExtractor={(log) => log.logId}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDownloadDialogOpen(true)}
                disabled={!data?.logs || data.logs.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                下载
              </Button>
            }
            emptyState={
              <EmptyState
                icon={FileText}
                title="暂无日志"
                description="该会话还没有记录任何日志"
              />
            }
            columns={[
              {
                key: 'createdAt',
                label: '时间',
                render: (log) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </span>
                ),
              },
              {
                key: 'logType',
                label: '类型',
                render: (log) => (
                  <Badge variant="outline">
                    {LOG_TYPE_LABELS[log.logType] || log.logType}
                  </Badge>
                ),
              },
              {
                key: 'level',
                label: '级别',
                render: (log) => (
                  <Badge className={LOG_LEVEL_COLORS[log.level] || 'bg-muted'}>
                    {LOG_LEVEL_LABELS[log.level] || log.level}
                  </Badge>
                ),
              },
              {
                key: 'message',
                label: '消息',
                render: (log) => (
                  <span className="text-sm text-foreground line-clamp-1">
                    {log.message}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: '操作',
                align: 'center',
                render: (log) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/logs/${log._id}`)}
                    title="查看详情"
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

          {/* 下载选项弹窗 */}
          <LogDownloadDialog
            open={downloadDialogOpen}
            onOpenChange={setDownloadDialogOpen}
            onExport={performExport}
            logCount={data?.pagination?.total || 0}
            description={`导出该会话的全部日志（共${data?.pagination?.total || 0}条）`}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
