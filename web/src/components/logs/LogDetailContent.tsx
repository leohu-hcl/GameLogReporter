import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoCard } from '@/components/common/InfoCard';
import { Log } from '@/types';
import { LOG_LEVEL_LABELS, LOG_TYPE_LABELS } from '@/components/logs/LogsTable';

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

/**
 * 日志详情内容（纯展示，不含页头/取数）。
 * 独立详情页与列表/会话页的快速查看弹窗共用，保证两处内容一致。
 */
export function LogDetailContent({ log }: { log: Log }) {
  return (
    <div className="space-y-6">
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
              ...(log.version
                ? [{
                    label: '客户端版本',
                    value: <span className="font-mono text-sm break-all">{log.version}</span>,
                  }]
                : []),
            ]}
          />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">消息</h3>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded break-all whitespace-pre-wrap">
              {log.message}
            </p>
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

export default LogDetailContent;
