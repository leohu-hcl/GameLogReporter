'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, AlertCircle, Smartphone } from 'lucide-react';
import { LogStats } from '@/types';

interface DashboardStatsProps {
  stats?: LogStats;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  onClick?: () => void;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const router = useRouter();

  // 计算今天的时间范围用于导航
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const now = new Date();
  const todayStart = today.toISOString();
  const todayEnd = now.toISOString();

  const statCards: StatCard[] = [
    {
      title: '今日日志',
      value: stats?.total || 0,
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-blue-50 text-blue-600',
      description: '今天记录的日志总数',
      onClick: () => {
        const params = new URLSearchParams({
          startTime: todayStart,
          endTime: todayEnd,
        });
        router.push(`/logs?${params.toString()}`);
      },
    },
    {
      title: '今日错误',
      value: stats?.byLevel?.error || 0,
      icon: <AlertCircle className="h-8 w-8" />,
      color: 'bg-red-50 text-red-600',
      description: '今天记录的错误日志',
      onClick: () => {
        const params = new URLSearchParams({
          level: 'error',
          startTime: todayStart,
          endTime: todayEnd,
        });
        router.push(`/logs?${params.toString()}`);
      },
    },
    {
      title: '今日警告',
      value: stats?.byLevel?.warning || 0,
      icon: <Users className="h-8 w-8" />,
      color: 'bg-yellow-50 text-yellow-600',
      description: '今天记录的警告日志',
      onClick: () => {
        const params = new URLSearchParams({
          level: 'warning',
          startTime: todayStart,
          endTime: todayEnd,
        });
        router.push(`/logs?${params.toString()}`);
      },
    },
    {
      title: '今日活跃设备',
      value: stats?.byDevice || 0,
      icon: <Smartphone className="h-8 w-8" />,
      color: 'bg-purple-50 text-purple-600',
      description: '今天有日志记录的活跃设备数',
      onClick: () => {
        router.push('/devices');
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <button
          key={index}
          onClick={stat.onClick}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className={`pb-2 ${stat.color}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.description && <p className="mt-1 text-xs text-gray-600">{stat.description}</p>}
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
