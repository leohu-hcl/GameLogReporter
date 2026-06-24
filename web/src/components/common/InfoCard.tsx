import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface InfoItem {
  label: string;
  value: React.ReactNode;
}

interface InfoCardProps {
  title?: string;
  items: InfoItem[];
  columns?: 1 | 2 | 3 | 4;
}

/**
 * 统一的信息展示卡片组件
 * 用于详情页面展示键值对信息
 */
export function InfoCard({ title, items, columns = 3 }: InfoCardProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <Card className="py-0">
      {title && (
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-display text-base font-semibold tracking-wide text-foreground">
            {title}
          </h3>
        </div>
      )}
      <CardContent className={title ? 'py-6' : 'py-6'}>
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-x-6 gap-y-5`}>
          {items.map((item, index) => (
            <div key={index} className="min-w-0">
              <p className="eyebrow mb-1.5">{item.label}</p>
              <div className="break-words text-sm font-medium text-foreground">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
