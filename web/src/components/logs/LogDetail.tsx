'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logService } from '@/api/logs';
import { Log } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { LogDetailContent } from '@/components/logs/LogDetailContent';
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
          <Card className="w-full max-w-md border-destructive/30 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">日志不存在</CardTitle>
              <CardDescription className="text-destructive">
                {error || '您要查看的日志已不存在或已被删除'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium mb-1">可能的原因：</p>
                <ul className="list-inside list-disc space-y-1 text-xs">
                  <li>日志ID 输入错误</li>
                  <li>日志已被管理员删除</li>
                  <li>相关会话已被删除</li>
                  <li>日志数据已过期或被清空</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">日志ID：</span>
                  <code className="ml-2 inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
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
      <Breadcrumb
        items={[
          { label: '日志', href: '/logs' },
          ...(log.sessionId
            ? [{ label: '所属会话', href: `/sessions/${log.sessionId}` }]
            : []),
          { label: '日志详情' },
        ]}
      />
      <PageHeader
        title="日志详情"
        description={new Date(log.timestamp).toLocaleString()}
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回日志列表
        </Button>
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
      </PageHeader>

      <LogDetailContent log={log} />
    </div>
  );
}

export default LogDetail;
