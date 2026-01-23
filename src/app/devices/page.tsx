'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { Pagination } from '@/components/common/Pagination';
import { useDevicesList } from '@/hooks/useDeviceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ExternalLink } from 'lucide-react';

/**
 * 设备列表页面
 */
export default function DevicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, error } = useDevicesList(page, limit);

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
          {/* 页头 */}
          <div>
            <h1 className="text-3xl font-bold">设备管理</h1>
            <p className="text-gray-500 mt-2">查看和管理所有游戏设备</p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">设备总数</p>
                  <p className="text-3xl font-bold">{pagination.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">活跃设备</p>
                  <p className="text-3xl font-bold text-green-600">
                    {devices.filter((d) => d.isActive).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">平均会话数</p>
                  <p className="text-3xl font-bold">
                    {devices.length > 0
                      ? (
                          devices.reduce((sum, d) => sum + (d.sessionCount || 0), 0) /
                          devices.length
                        ).toFixed(1)
                      : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">总日志数</p>
                  <p className="text-3xl font-bold">
                    {devices.reduce((sum, d) => sum + (d.logCount || 0), 0)}
                  </p>
                </div>
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
                <div className="py-8 text-center text-gray-500">暂无设备数据</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">设备型号</th>
                        <th className="px-4 py-2 text-left font-medium">平台</th>
                        <th className="px-4 py-2 text-left font-medium">OS版本</th>
                        <th className="px-4 py-2 text-center font-medium">会话数</th>
                        <th className="px-4 py-2 text-center font-medium">日志数</th>
                        <th className="px-4 py-2 text-left font-medium">最后连接</th>
                        <th className="px-4 py-2 text-center font-medium">状态</th>
                        <th className="px-4 py-2 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => (
                        <tr key={device.deviceId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{device.deviceModel}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{device.platform}</Badge>
                          </td>
                          <td className="px-4 py-2 text-xs">{device.osVersion || '-'}</td>
                          <td className="px-4 py-2 text-center">{device.sessionCount || 0}</td>
                          <td className="px-4 py-2 text-center">{device.logCount || 0}</td>
                          <td className="px-4 py-2 text-xs">
                            {new Date(device.lastSeen).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {device.isActive ? (
                              <Badge variant="default" className="bg-green-600">
                                活跃
                              </Badge>
                            ) : (
                              <Badge variant="secondary">离线</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
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
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={limit}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
