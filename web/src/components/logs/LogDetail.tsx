'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logService } from '@/api/logs';
import { Log } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { InfoCard } from '@/components/common/InfoCard';
import { ArrowLeft, Copy, Download, ChevronLeft } from 'lucide-react';
import { LOG_LEVEL_LABELS, LOG_TYPE_LABELS } from '@/components/logs/LogsTable';

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

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      debug: 'bg-muted text-muted-foreground border border-border',
      info: 'bg-info/15 text-info border border-info/30',
      warning: 'bg-warning/15 text-warning border border-warning/30',
      error: 'bg-destructive/15 text-destructive border border-destructive/30',
      critical: 'bg-info/15 text-info border border-info/30',
    };
    return colors[level] || 'bg-muted text-muted-foreground border border-border';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      error: 'bg-destructive/15 text-destructive border border-destructive/30',
      warning: 'bg-warning/15 text-warning border border-warning/30',
      info: 'bg-info/15 text-info border border-info/30',
      performance: 'bg-success/15 text-success border border-success/30',
      user_action: 'bg-info/15 text-info border border-info/30',
      custom: 'bg-muted text-muted-foreground border border-border',
    };
    return colors[type] || 'bg-muted text-muted-foreground border border-border';
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>日志信息</span>
            <div className="flex gap-2">
              <Badge className={getTypeColor(log.logType)}>
                {LOG_TYPE_LABELS[log.logType] || log.logType}
              </Badge>
              <Badge className={getLevelColor(log.level)}>
                {LOG_LEVEL_LABELS[log.level] || log.level}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoCard
            columns={2}
            items={[
              {
                label: '日志 ID',
                value: <span className="font-mono text-sm break-all">{log.logId}</span>,
              },
              {
                label: '会话 ID',
                value: <span className="font-mono text-sm break-all">{log.sessionId}</span>,
              },
              {
                label: '发生时间',
                value: new Date(log.timestamp).toLocaleString(),
              },
              {
                label: '创建时间',
                value: new Date(log.createdAt).toLocaleString(),
              },
            ]}
          />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">消息</h3>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded break-all">
              {log.message}
            </p>
          </div>

          {log.clientVersion && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">客户端版本</h3>
              <p className="text-sm text-foreground">{log.clientVersion}</p>
            </div>
          )}
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
            <pre className="bg-muted/50 border border-border p-4 rounded overflow-x-auto text-xs text-foreground">
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
            <pre className="bg-muted/50 border border-border p-4 rounded overflow-x-auto text-xs text-foreground">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LogDetail;
