'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/common/StatCard';
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

  const statCards = [
    {
      title: '今日日志',
      value: stats?.total || 0,
      icon: FileText,
      iconColor: 'text-blue-600',
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
      icon: AlertCircle,
      iconColor: 'text-red-600',
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
      icon: Users,
      iconColor: 'text-yellow-600',
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
      icon: Smartphone,
      iconColor: 'text-purple-600',
      description: '今天有日志记录的活跃设备数',
      onClick: () => {
        router.push('/devices');
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.iconColor}
          description={stat.description}
          onClick={stat.onClick}
        />
      ))}
    </div>
  );
}
