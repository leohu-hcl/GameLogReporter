import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface FilterBarProps {
  children: React.ReactNode;
}

/**
 * 统一的过滤栏容器组件
 * 提供一致的过滤器布局和样式
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">{children}</div>
      </CardContent>
    </Card>
  );
}
