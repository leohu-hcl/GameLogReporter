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
    <Card>
      {title && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
      )}
      <CardContent className={title ? 'pt-6' : 'py-6'}>
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
          {items.map((item, index) => (
            <div key={index}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {item.label}
              </p>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
