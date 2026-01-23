'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logService } from '@/api/logs';
import { Log } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Copy, Download, ChevronLeft } from 'lucide-react';

interface LogDetailProps {
  logId: string;
}

/**
 * 日志详情组件
 */
export function LogDetail({ logId }: LogDetailProps) {
  const router = useRouter();
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 获取日志详情
  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await logService.getLogDetail(logId);
        setLog(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载日志详情失败';
        setError(errorMessage);
        console.error('Failed to fetch log detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (logId) {
      fetchLog();
    }
  }, [logId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !log) {
    return (
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
              <CardTitle className="text-red-800">日志不存在</CardTitle>
              <CardDescription className="text-red-600">
                {error || '您要查看的日志已不存在或已被删除'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded bg-red-100 p-3 text-sm text-red-700">
                <p className="font-medium mb-1">可能的原因：</p>
                <ul className="list-inside list-disc space-y-1 text-xs">
                  <li>日志ID 输入错误</li>
                  <li>日志已被管理员删除</li>
                  <li>相关会话已被删除</li>
                  <li>日志数据已过期或被清空</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">日志ID：</span>
                  <code className="ml-2 inline-block bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                    {logId}
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
                  查看所有日志
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      debug: 'bg-gray-100 text-gray-800',
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-purple-100 text-purple-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
      performance: 'bg-green-100 text-green-800',
      user_action: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLog = () => {
    const jsonString = JSON.stringify(log, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonString));
    element.setAttribute('download', `log-${log._id}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* 返回按钮和操作栏 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回日志列表
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? '已复制' : '复制'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLog}
          >
            <Download className="w-4 h-4 mr-2" />
            下载
          </Button>
        </div>
      </div>

      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>日志详情</span>
            <div className="flex gap-2">
              <Badge className={getTypeColor(log.logType)}>
                {log.logType}
              </Badge>
              <Badge className={getLevelColor(log.level)}>
                {log.level}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 日志 ID 和消息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">日志 ID</h3>
              <p className="text-sm font-mono text-gray-900 break-all">{log.logId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">会话 ID</h3>
              <p className="text-sm font-mono text-gray-900 break-all">{log.sessionId}</p>
            </div>
          </div>

          {/* 消息 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">消息</h3>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded break-all">
              {log.message}
            </p>
          </div>

          {/* 时间戳 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">发生时间</h3>
              <p className="text-sm text-gray-900">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">创建时间</h3>
              <p className="text-sm text-gray-900">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 额外信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.clientVersion && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">客户端版本</h3>
                <p className="text-sm text-gray-900">{log.clientVersion}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 标签 */}
      {log.tags && log.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>标签</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {log.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 堆栈跟踪 */}
      {log.stackTrace && (
        <Card>
          <CardHeader>
            <CardTitle>堆栈跟踪</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs text-gray-900">
              {log.stackTrace}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 元数据 */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>元数据</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs text-gray-900">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LogDetail;
