'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { Pagination } from '@/components/common/Pagination';
import { useDeviceWithSessions } from '@/hooks/useDeviceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChevronLeft, ExternalLink, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * 设备详情页面
 */
export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.deviceId as string;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, error } = useDeviceWithSessions(deviceId, page, limit);

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
              <Card className="w-full max-w-md border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">设备不存在</CardTitle>
                  <CardDescription className="text-red-600">
                    {error?.message || '您要查看的设备已不存在或已被删除'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded bg-red-100 p-3 text-sm text-red-700">
                    <p className="font-medium mb-1">可能的原因：</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>设备ID 输入错误</li>
                      <li>设备已被管理员删除</li>
                      <li>设备从未连接过应用</li>
                      <li>设备数据已过期或被清空</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">设备ID：</span>
                      <code className="ml-2 inline-block bg-gray-200 px-2 py-1 rounded text-xs font-mono">
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
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Button>

          {/* 设备基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>{device.deviceModel}</CardTitle>
              <CardDescription>
                {new Date(device.firstSeen).toLocaleString('zh-CN')} 首次连接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500 mb-2">设备ID</p>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded break-all">
                    {device.deviceId}
                  </code>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">平台</p>
                  <Badge variant="outline">{device.platform}</Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">活跃状态</p>
                  {device.isActive ? (
                    <Badge variant="default" className="bg-green-600">
                      活跃
                    </Badge>
                  ) : (
                    <Badge variant="secondary">离线</Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">OS版本</p>
                  <p className="text-sm font-medium">{device.osVersion || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Unity版本</p>
                  <p className="text-sm font-medium">{device.unityVersion || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">首次连接</p>
                  <p className="text-xs font-medium">
                    {new Date(device.firstSeen).toLocaleString('zh-CN')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">最后连接</p>
                  <p className="text-xs font-medium">
                    {new Date(device.lastSeen).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500 mb-2">运行天数</p>
                  <p className="text-2xl font-bold text-blue-600">{uptimeDays}</p>
                  <p className="text-xs text-gray-500 mt-1">天</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">会话总数</p>
                  <p className="text-2xl font-bold text-purple-600">{pagination.total}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">总日志数</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {sessions.reduce((sum, s) => sum + (s.logCount || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 会话列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>设备会话</CardTitle>
                  <CardDescription>
                    共 {pagination.total} 个会话，第 {page} / {pagination.totalPages} 页
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSessions}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  下载
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">暂无会话</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">会话ID</th>
                        <th className="px-4 py-2 text-left font-medium">开始时间</th>
                        <th className="px-4 py-2 text-left font-medium">状态</th>
                        <th className="px-4 py-2 text-center font-medium">日志数</th>
                        <th className="px-4 py-2 text-center font-medium">错误数</th>
                        <th className="px-4 py-2 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.sessionId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs font-mono">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => router.push(`/sessions/${session.sessionId}`)}
                              title="查看会话详情"
                            >
                              {session.sessionId?.substring(0, 16)}...
                            </button>
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {new Date(session.startTime).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant={session.status === 'active' ? 'default' : 'secondary'}
                            >
                              {session.status === 'active' ? '进行中' : '已结束'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center">{session.logCount || 0}</td>
                          <td className="px-4 py-2 text-center">
                            {session.errorCount && session.errorCount > 0 ? (
                              <Badge variant="destructive">{session.errorCount}</Badge>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/sessions/${session.sessionId}`)}
                              title="查看会话详情"
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
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
