'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/common/StatCard';
import { FileText, AlertTriangle, AlertCircle, Smartphone } from 'lucide-react';
import { LogStats } from '@/types';
import { useDailyStats } from '@/hooks/useLogsQueries';

interface DashboardStatsProps {
  stats?: LogStats;
}

type Tone = 'primary' | 'destructive' | 'warning' | 'info' | 'success';

export function DashboardStats({ stats }: DashboardStatsProps) {
  const router = useRouter();
  const { data: daily } = useDailyStats(7);

  // 计算今天的时间范围用于导航
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const todayStart = today.toISOString();
  const todayEnd = now.toISOString();

  const statCards: {
    title: string;
    value: string | number;
    icon: typeof FileText;
    tone: Tone;
    description: string;
    trend?: number[];
    onClick: () => void;
  }[] = [
    {
      title: '今日日志',
      value: stats?.total || 0,
      icon: FileText,
      tone: 'primary',
      description: '今天记录的日志总数',
      trend: daily?.map((d) => d.total),
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
      tone: 'destructive',
      description: '今天记录的错误日志',
      trend: daily?.map((d) => d.error),
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
      icon: AlertTriangle,
      tone: 'warning',
      description: '今天记录的警告日志',
      trend: daily?.map((d) => d.warning),
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
      tone: 'info',
      description: '今天有日志记录的活跃设备数',
      trend: daily?.map((d) => d.device),
      onClick: () => {
        router.push('/devices');
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="animate-rise"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
            description={stat.description}
            trend={stat.trend}
            onClick={stat.onClick}
          />
        </div>
      ))}
    </div>
  );
}
