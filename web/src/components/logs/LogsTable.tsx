'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLogsList } from '@/hooks/useLogsQueries';
import { logService } from '@/api/logs';
import { LogFilters, Log } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Eye, RefreshCw, Copy, Filter, X, Download, Calendar, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogDownloadDialog } from '@/components/logs/LogDownloadDialog';
import { LogDetailContent } from '@/components/logs/LogDetailContent';
import { format } from 'date-fns';
import { useSettings } from '@/context/SettingsContext';

interface LogTableProps {
  initialFilters?: LogFilters;
}

export const LOG_TYPE_LABELS: Record<string, string> = {
  performance: '性能',
  user_action: '用户操作',
  system_log: '系统日志',
  custom: '自定义',
};

export const LOG_LEVEL_LABELS: Record<string, string> = {
  debug: '调试',
  info: '信息',
  warning: '警告',
  error: '错误',
  critical: '严重',
};

export const LOG_LEVEL_COLORS: Record<string, string> = {
  debug: 'bg-muted text-muted-foreground border-border',
  info: 'bg-info/15 text-info border-info/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-destructive/15 text-destructive border-destructive/30',
  critical: 'bg-destructive text-white border-destructive',
};

export const LOG_TYPE_COLORS: Record<string, string> = {
  performance: 'bg-success/12 text-success border-success/25',
  user_action: 'bg-info/12 text-info border-info/25',
  system_log: 'bg-warning/12 text-warning border-warning/25',
  custom: 'bg-muted text-muted-foreground border-border',
};

export function LogsTable({ initialFilters }: LogTableProps) {
  const router = useRouter();
  const { getPageSize } = useSettings();
  const pageSize = getPageSize('logs');
  
  // 默认最近7天
  const getDefaultDateRange = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  };

  const defaultRange = !initialFilters?.startTime && !initialFilters?.endTime ? getDefaultDateRange() : null;

  const [filters, setFilters] = useState<LogFilters>({
    page: 1,
    limit: pageSize,
    ...initialFilters,
    ...(defaultRange ? { startTime: defaultRange.startTime, endTime: defaultRange.endTime } : {}),
  });

  const [search, setSearch] = useState(initialFilters?.search || '');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState(
    initialFilters?.startTime 
      ? format(new Date(initialFilters.startTime), 'yyyy-MM-dd') 
      : defaultRange?.startDate || ''
  );
  const [endDate, setEndDate] = useState(
    initialFilters?.endTime 
      ? format(new Date(initialFilters.endTime), 'yyyy-MM-dd') 
      : defaultRange?.endDate || ''
  );
  const [quickRangeType, setQuickRangeType] = useState<'today' | 'yesterday' | 'week' | 'month' | null>(null);

  const { data, isLoading, error, refetch } = useLogsList(filters);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: pageSize,
    }));
  }, [pageSize]);

  // 自动隐藏复制反馈
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const handleSearch = () => {
    const keyword = search.trim();
    setFilters((prev) => ({
      ...prev,
      search: keyword || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleFilterChange = (key: keyof LogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: pageSize,
    });
    setSearch('');
    setStartDate('');
    setEndDate('');
  };

  const handleDateRangeChange = () => {
    const newFilters: LogFilters = { ...filters, page: 1 };
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      newFilters.startTime = start.toISOString();
    } else {
      newFilters.startTime = undefined;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      // 如果是"今天"，结束时间应该是现在，而不是23:59:59
      if (quickRangeType === 'today') {
        const now = new Date();
        newFilters.endTime = now.toISOString();
      } else {
        // 其他情况使用该日期的23:59:59
        end.setHours(23, 59, 59, 999);
        newFilters.endTime = end.toISOString();
      }
    } else {
      newFilters.endTime = undefined;
    }
    
    setFilters(newFilters);
  };

  const handleQuickDateRange = (range: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    let startTime: Date;
    let endTime: Date;
    
    switch (range) {
      case 'today':
        startTime = new Date(today);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(now);
        setQuickRangeType('today');
        break;
      case 'yesterday':
        startTime = new Date(today);
        startTime.setDate(startTime.getDate() - 1);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(startTime);
        endTime.setHours(23, 59, 59, 999);
        setQuickRangeType('yesterday');
        break;
      case 'week':
        startTime = new Date(today);
        startTime.setDate(startTime.getDate() - 7);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(now);
        setQuickRangeType('week');
        break;
      case 'month':
        startTime = new Date(today);
        startTime.setDate(startTime.getDate() - 30);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(now);
        setQuickRangeType('month');
        break;
    }
    
    // 更新显示的日期
    setStartDate(format(startTime, 'yyyy-MM-dd'));
    setEndDate(format(endTime, 'yyyy-MM-dd'));
    
    // 直接更新筛选条件，不依赖异步state
    const newFilters: LogFilters = { ...filters, page: 1 };
    newFilters.startTime = startTime.toISOString();
    newFilters.endTime = endTime.toISOString();
    setFilters(newFilters);
  };

  // 获取所有满足筛选条件的日志
  const fetchAllFilteredLogs = async (currentFilters: LogFilters): Promise<Log[]> => {
    const allLogs: Log[] = [];
    const pageSize = 100;
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await logService.getLogs({
          ...currentFilters,
          page: currentPage,
          limit: pageSize,
        });

        allLogs.push(...(result.logs || []));

        if (currentPage >= (result.totalPages || 1)) {
          hasMore = false;
        } else {
          currentPage++;
        }
      } catch (err) {
        console.error('Error fetching logs page:', currentPage, err);
        hasMore = false;
      }
    }

    return allLogs;
  };

  const performExport = async (params: { format: 'json' | 'text'; sortOrder: 'asc' | 'desc'; stackMode: 'all' | 'errors' | 'none' }) => {
    if (!data || !data.items) return;

    setIsExporting(true);
    const toastId = toast.loading('正在导出日志…');
    try {
      // 构建完整的筛选条件
      const exportFilters: LogFilters = {
        page: 1,
        limit: 100,
        logType: filters.logType,
        level: filters.level,
        sessionId: filters.sessionId,
        startTime: filters.startTime,
        endTime: filters.endTime,
        search: search || undefined,
      };

      // 获取所有满足条件的日志
      const allLogs = await fetchAllFilteredLogs(exportFilters);

      // 按时间排序
      allLogs.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp).getTime();
        const timeB = new Date(b.createdAt || b.timestamp).getTime();
        return params.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });

      if (params.format === 'json') {
        exportAsJSON(allLogs, params.stackMode);
      } else {
        exportAsText(allLogs, params.stackMode, params.sortOrder);
      }
      toast.success(`已导出 ${allLogs.length} 条日志`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导出失败，请重试', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = (logs: Log[], stackMode: 'all' | 'errors' | 'none') => {
    const processedLogs = logs.map((log) => {
      // 根据模式处理堆栈：errors 仅保留 ERROR/CRITICAL 的 stackTrace
      const level = (log.level || '').toLowerCase();
      const isErrorLevel = level === 'error' || level === 'critical';

      if (stackMode === 'all') return log;
      if (stackMode === 'errors') {
        if (isErrorLevel) return log;
        const { stackTrace, ...rest } = log;
        return rest;
      }
      // none
      const { stackTrace, ...rest } = log;
      return rest;
    });

    const logsJson = JSON.stringify(processedLogs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-filtered-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsText = (logs: Log[], stackMode: 'all' | 'errors' | 'none', sortOrder: 'asc' | 'desc') => {
    const formatDate = (iso?: string) => {
      const d = new Date(iso || new Date().toISOString());
      const pad = (n: number, l = 2) => String(n).padStart(l, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
    };

    const header = `Unity Editor Like Log Export\nTotal Items: ${logs.length}\nSort: ${sortOrder === 'asc' ? '升序（从早到晚）' : '降序（从晚到早）'}\nGenerated: ${formatDate()}\n-----------------------------\n`;

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
    a.download = `logs-filtered-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySessionId = (sessionId: string) => {
    navigator.clipboard.writeText(sessionId);
    setCopiedId(sessionId);
    toast.success('会话ID已复制');
  };

  const handleViewDetail = async (log: Log) => {
    // 先用列表已有数据即时展开，再按 id 拉完整日志（含版本号，版本存于会话，仅单条查询 join）。
    setSelectedLog(log);
    setSheetOpen(true);
    try {
      const full = await logService.getLogDetail(log._id);
      // 防串扰：期间用户可能已切换到别的日志
      setSelectedLog((cur) => (cur?._id === log._id ? full : cur));
    } catch {
      // 拉取失败则保留列表数据，版本号缺省不显示
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>加载日志失败，请稍后重试</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shadow-sm hover:shadow-md transition-all"
          >
            <Filter className="h-4 w-4" />
            筛选
          </Button>
          {(filters.logType || filters.level || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="border-destructive/40 text-destructive transition-all hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              清空
            </Button>
          )}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          共 {data?.total || 0} 条 • 页码 {data?.page || 1}/{data?.totalPages || 1}
        </div>
      </div>

      {/* 可折叠的筛选面板 */}
      {showFilters && (
        <div className="panel space-y-4 p-5">
          {/* 第一行：搜索、类型、级别 */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-muted-foreground">搜索消息</label>
              <Input
                placeholder="关键字..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-9 w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-muted-foreground">日志类型</label>
              <Select
                value={filters.logType || 'all'}
                onValueChange={(value) => handleFilterChange('logType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {Object.entries(LOG_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-muted-foreground">日志级别</label>
              <Select
                value={filters.level || 'all'}
                onValueChange={(value) => handleFilterChange('level', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {Object.entries(LOG_LEVEL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 第二行：时间筛选 */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-muted p-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <label className="whitespace-nowrap font-mono text-xs uppercase tracking-wider text-muted-foreground">时间范围</label>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQuickRangeType(null);
                }}
                className="h-9 w-40"
                placeholder="开始日期"
              />
              <span className="text-muted-foreground">至</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQuickRangeType(null);
                }}
                className="h-9 w-40"
                placeholder="结束日期"
              />
              <Button
                onClick={handleDateRangeChange}
                size="sm"
                variant="outline"
                className="h-9 px-4"
              >
                应用
              </Button>
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-3">
              <span className="font-mono text-xs text-muted-foreground">快捷选择:</span>
              <Button 
                onClick={() => handleQuickDateRange('today')} 
                size="sm" 
                variant="ghost"
                className="h-8 px-3 text-xs"
              >
                今天
              </Button>
              <Button 
                onClick={() => handleQuickDateRange('yesterday')} 
                size="sm" 
                variant="ghost"
                className="h-8 px-3 text-xs"
              >
                昨天
              </Button>
              <Button 
                onClick={() => handleQuickDateRange('week')} 
                size="sm" 
                variant="ghost"
                className="h-8 px-3 text-xs"
              >
                最近7天
              </Button>
              <Button 
                onClick={() => handleQuickDateRange('month')} 
                size="sm" 
                variant="ghost"
                className="h-8 px-3 text-xs"
              >
                最近30天
              </Button>
            </div>
          </div>

          {/* 第三行：操作按钮 */}
          <div className="flex items-center gap-2">
            <Button onClick={handleSearch} size="sm" className="h-9 px-6">
              搜索
            </Button>
            {(search || filters.logType || filters.level || startDate || endDate) && (
              <Button 
                onClick={handleClearFilters} 
                variant="outline"
                size="sm"
                className="h-9 px-4"
              >
                清空筛选
              </Button>
            )}
            {(filters.startTime || filters.endTime) && (
              <span className="ml-2 font-mono text-xs text-primary">
                {filters.startTime && `从 ${format(new Date(filters.startTime), 'yyyy-MM-dd')}`}
                {filters.startTime && filters.endTime && ' '}
                {filters.endTime && `到 ${format(new Date(filters.endTime), 'yyyy-MM-dd')}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>日志列表</CardTitle>
              <CardDescription>
                {data && `共 ${data.total} 条日志，当前第 ${data.page} 页`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDownloadDialogOpen(true)}
                disabled={!data || !data.items || data.items.length === 0 || isExporting}
                className="gap-2"
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? '导出中…' : '下载'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="暂无日志数据"
              description="尝试调整筛选条件"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">时间</th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">类型</th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">级别</th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">会话ID</th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">消息</th>
                    <th className="px-4 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.logId} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">{LOG_TYPE_LABELS[log.logType] || log.logType}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${LOG_LEVEL_COLORS[log.level] || 'bg-muted'} border`}>
                          {LOG_LEVEL_LABELS[log.level] || log.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            className="cursor-pointer font-mono text-xs font-medium text-primary hover:underline"
                            onClick={() => router.push(`/sessions/${log.sessionId}`)}
                            title="查看会话详情"
                          >
                            {log.sessionId?.substring(0, 8)}...
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopySessionId(log.sessionId)}
                            title={copiedId === log.sessionId ? '已复制!' : '复制会话ID'}
                          >
                            <Copy className={`h-3 w-3 ${copiedId === log.sessionId ? 'text-success' : ''}`} />
                          </Button>
                        </div>
                      </td>
                      <td className="max-w-xs truncate px-4 py-4">{log.message}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(log)}
                            title="快速查看"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              total={data.total}
              limit={data.limit}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* 快速查看Dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="!w-[90vw] !max-w-5xl !max-h-[85vh] flex flex-col !p-6 !gap-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-4">
              <LogDetailContent log={selectedLog} />

              {/* 操作按钮 */}
              <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card pt-4">
                <Button
                  onClick={() => router.push(`/logs/${selectedLog._id}`)}
                  className="flex-1 h-8 text-sm"
                >
                  查看完整详情
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  className="flex-1 h-8 text-sm"
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 下载选项弹窗 */}
      <LogDownloadDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        onExport={performExport}
        logCount={data?.total || 0}
        description="将导出当前筛选命中的全部日志（不限当前页）"
      />
    </div>
  );
}
