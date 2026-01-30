'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
}

/**
 * 通用分页组件
 * 用于日志、设备、会话等列表页面
 */
export function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  showPageInfo = true,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {showPageInfo && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          第 {currentPage} / {totalPages} 页，每页 {limit} 条，共 {total} 条
        </div>
      )}

      {/* 页码导航 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 首页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-8 px-2 text-xs"
        >
          首页
        </Button>

        {/* 上一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 页码按钮 */}
        <div className="flex gap-1">
          {(() => {
            const pages: (number | string)[] = [];
            const maxVisible = 5;
            const halfWindow = Math.floor(maxVisible / 2);
            let start = Math.max(1, currentPage - halfWindow);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end - start < maxVisible - 1) {
              start = Math.max(1, end - maxVisible + 1);
            }

            if (start > 1) {
              pages.push(1);
              if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
              pages.push(i);
            }

            if (end < totalPages) {
              if (end < totalPages - 1) pages.push('...');
              pages.push(totalPages);
            }

            return pages.map((page, idx) =>
              typeof page === 'number' ? (
                <Button
                  key={idx}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ) : (
                <span key={idx} className="px-2 text-gray-500 dark:text-gray-400">
                  ...
                </span>
              )
            );
          })()}
        </div>

        {/* 下一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* 末页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2 text-xs"
        >
          末页
        </Button>

        {/* 跳转输入框 */}
        <div className="flex items-center gap-2 ml-auto whitespace-nowrap">
          <span className="text-xs text-gray-600 dark:text-gray-400">跳转:</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">页码</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            placeholder="1"
            className="h-8 w-20 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt((e.target as HTMLInputElement).value);
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
