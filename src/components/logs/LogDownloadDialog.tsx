'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Log } from '@/types/log';

interface LogDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (params: {
    format: 'json' | 'text';
    sortOrder: 'asc' | 'desc';
    stackMode: 'all' | 'errors' | 'none';
  }) => Promise<void> | void;
  logCount: number;
  description?: string;
}

export function LogDownloadDialog({
  open,
  onOpenChange,
  onExport,
  logCount,
  description = '将导出当前筛选命中的全部日志（不限当前页）'
}: LogDownloadDialogProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'text'>('json');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stackMode, setStackMode] = useState<'all' | 'errors' | 'none'>('errors');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({ format: exportFormat, sortOrder, stackMode });
      onOpenChange(false);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>下载日志</DialogTitle>
          <DialogDescription>
            选择导出格式、排序和堆栈包含范围
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 导出格式 */}
          <div>
            <label className="text-sm font-medium mb-2 block">导出格式</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'text')}
                  className="w-4 h-4"
                />
                <span className="text-sm">JSON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="text"
                  checked={exportFormat === 'text'}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'text')}
                  className="w-4 h-4"
                />
                <span className="text-sm">纯文本</span>
              </label>
            </div>
          </div>

          {/* 时间排序 */}
          <div>
            <label className="text-sm font-medium mb-2 block">时间排序</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value="asc"
                  checked={sortOrder === 'asc'}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-4 h-4"
                />
                <span className="text-sm">升序（从早到晚）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value="desc"
                  checked={sortOrder === 'desc'}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-4 h-4"
                />
                <span className="text-sm">降序（从晚到早）</span>
              </label>
            </div>
          </div>

          {/* 堆栈包含范围 */}
          <div>
            <label className="text-sm font-medium mb-2 block">堆栈包含范围</label>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stackMode"
                  value="errors"
                  checked={stackMode === 'errors'}
                  onChange={(e) => setStackMode(e.target.value as any)}
                  className="w-4 h-4"
                />
                <span>仅错误/致命日志保留堆栈（推荐）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stackMode"
                  value="all"
                  checked={stackMode === 'all'}
                  onChange={(e) => setStackMode(e.target.value as any)}
                  className="w-4 h-4"
                />
                <span>全部日志保留堆栈</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stackMode"
                  value="none"
                  checked={stackMode === 'none'}
                  onChange={(e) => setStackMode(e.target.value as any)}
                  className="w-4 h-4"
                />
                <span>不包含堆栈</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {description}
            </p>
          </div>

          {/* 预览信息 */}
          <div className="rounded bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-medium mb-1">📊 导出信息</p>
            <p>• 格式：{exportFormat === 'json' ? 'JSON' : '纯文本'}</p>
            <p>• 排序：{sortOrder === 'asc' ? '升序' : '降序'}</p>
            <p>• 堆栈：{stackMode === 'all' ? '全部保留' : stackMode === 'errors' ? '仅错误/致命保留' : '不包含'}</p>
            <p className="mt-2">✓ 将导出{logCount}条日志</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            取消
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || logCount === 0}
          >
            {isExporting ? '导出中...' : '开始下载'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
