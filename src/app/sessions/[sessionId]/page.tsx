'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { Pagination } from '@/components/common/Pagination';
import { useSessionWithLogs } from '@/hooks/useSessionQueries';
import { sessionService } from '@/api/sessions';
import { Log } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChevronLeft, Copy, Download, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogDownloadDialog } from '@/components/logs/LogDownloadDialog';

/**
 * 会话详情页面
 */
export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const { data, isLoading, error } = useSessionWithLogs(sessionId, page, limit);

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
    debug: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
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
              <Card className="w-full max-w-md border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">会话不存在</CardTitle>
                  <CardDescription className="text-red-600">
                    {error?.message || '您要查看的会话已不存在或已被删除'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded bg-red-100 p-3 text-sm text-red-700">
                    <p className="font-medium mb-1">可能的原因：</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>会话ID 输入错误</li>
                      <li>会话已被管理员删除</li>
                      <li>设备数据已被清空</li>
                      <li>会话数据已过期</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">会话ID：</span>
                      <code className="ml-2 inline-block bg-gray-200 px-2 py-1 rounded text-xs font-mono">
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
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Button>

          {/* 会话基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>会话信息</CardTitle>
              <CardDescription>
                {new Date(session.startTime).toLocaleString('zh-CN')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* 会话ID */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">会话ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded break-all">
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
                          copiedId === `session-${session.sessionId}` ? 'text-green-600' : ''
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {/* 设备ID */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">设备ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded truncate">
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
                          copiedId === `device-${session.deviceId}` ? 'text-green-600' : ''
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {/* 状态 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">会话状态</p>
                  <Badge
                    variant={session.status === 'active' ? 'default' : 'secondary'}
                  >
                    {session.status === 'active' ? '进行中' : '已结束'}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                {/* 开始时间 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">开始时间</p>
                  <p className="text-sm font-medium">
                    {new Date(session.startTime).toLocaleString('zh-CN')}
                  </p>
                </div>

                {/* 结束时间 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">结束时间</p>
                  <p className="text-sm font-medium">
                    {session.endTime
                      ? new Date(session.endTime).toLocaleString('zh-CN')
                      : '进行中...'}
                  </p>
                </div>

                {/* 会话时长 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">会话时长</p>
                  <p className="text-sm font-medium">
                    {sessionDuration
                      ? `${Math.floor(sessionDuration / 60)}分${sessionDuration % 60}秒`
                      : '进行中...'}
                  </p>
                </div>

                {/* 日志数量 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">日志数量</p>
                  <p className="text-sm font-medium">{pagination.total} 条</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 设备信息 */}
          {device && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">设备信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">设备型号</p>
                    <p className="text-sm font-medium">{device.deviceModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">平台</p>
                    <p className="text-sm font-medium">{device.platform}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">OS版本</p>
                    <p className="text-sm font-medium">{device.osVersion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Unity版本</p>
                    <p className="text-sm font-medium">{device.unityVersion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">首次连接</p>
                    <p className="text-xs font-medium">
                      {new Date(device.firstSeen).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">最后连接</p>
                    <p className="text-xs font-medium">
                      {new Date(device.lastSeen).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 日志列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>会话日志</CardTitle>
                  <CardDescription>
                    共 {pagination.total} 条，第 {page} / {pagination.totalPages} 页
                  </CardDescription>
                </div>
                <div className="flex gap-2">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">暂无日志</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">时间</th>
                        <th className="px-4 py-2 text-left font-medium">类型</th>
                        <th className="px-4 py-2 text-left font-medium">级别</th>
                        <th className="px-4 py-2 text-left font-medium">消息</th>
                        <th className="px-4 py-2 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.logId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs">
                            {new Date(log.createdAt).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">
                              {LOG_TYPE_LABELS[log.logType] || log.logType}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <Badge className={LOG_LEVEL_COLORS[log.level] || 'bg-gray-100'}>
                              {LOG_LEVEL_LABELS[log.level] || log.level}
                            </Badge>
                          </td>
                          <td className="max-w-xs truncate px-4 py-2 text-sm">
                            {log.message}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/logs/${log._id}`)}
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
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={limit}
                  onPageChange={setPage}
                />
              </div>
            </CardContent>
          </Card>

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
