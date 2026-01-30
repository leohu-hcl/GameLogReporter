import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  description?: string;
}

/**
 * 统一的统计卡片组件
 * 简洁专业的设计，避免过度渐变
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  onClick,
  description,
}: StatCardProps) {
  const CardWrapper = onClick ? 'button' : 'div';
  
  return (
    <Card
      className={`p-6 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      {...(onClick && { role: 'button', tabIndex: 0 })}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className={`rounded-lg bg-gray-50 dark:bg-gray-800 p-3 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
