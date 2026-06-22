'use client';

import { useState } from 'react';
import { useSystemConfig, useUpdateSystemConfig, useTriggerSessionCleanup, useSystemStats } from '@/hooks/useConfigQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/common/StatCard';
import { AlertCircle, CheckCircle, RefreshCw, Activity, Database, Clock, Bell } from 'lucide-react';
import { format } from 'date-fns';

/**
 * 系统设置组件
 */
export function SystemSettings() {
  const { data: config, isLoading: isLoadingConfig, error: configError } = useSystemConfig();
  const { data: stats, isLoading: isLoadingStats } = useSystemStats();
  const { mutate: updateConfig, isPending: isUpdating, isSuccess: updateSuccess } = useUpdateSystemConfig();
  const { mutate: triggerCleanup, isPending: isCleaningUp } = useTriggerSessionCleanup();

  const [cleanupInterval, setCleanupInterval] = useState<number | ''>('');
  const [inactiveHours, setInactiveHours] = useState<number | ''>('');

  // 当配置加载完成时，填充表单
  const handleConfigLoaded = () => {
    if (config) {
      setCleanupInterval(config.sessionCleanupInterval);
      setInactiveHours(config.inactiveSessionHours);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (configError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          加载系统配置失败，请稍后重试
        </AlertDescription>
      </Alert>
    );
  }

  if (config && cleanupInterval === '') {
    handleConfigLoaded();
  }

  const handleUpdateConfig = () => {
    if (cleanupInterval === '' || inactiveHours === '') {
      alert('请填写所有字段');
      return;
    }

    updateConfig({
      sessionCleanupInterval: Number(cleanupInterval),
      inactiveSessionHours: Number(inactiveHours),
    });
  };

  const handleManualCleanup = () => {
    if (window.confirm('确认立即执行不活跃会话清理任务？')) {
      triggerCleanup(undefined);
    }
  };

  const statCards = [
    {
      title: '活跃会话',
      value: stats?.activeSessions || 0,
      icon: Activity,
      iconColor: 'text-success',
    },
    {
      title: '总会话数',
      value: stats?.totalSessions || 0,
      icon: Database,
      iconColor: 'text-primary',
    },
    {
      title: '最后清理时间',
      value: stats?.lastCleanupTime ? format(new Date(stats.lastCleanupTime), 'MM-dd HH:mm') : '-',
      icon: Clock,
      iconColor: 'text-info',
    },
    {
      title: '最后告警检查',
      value: stats?.lastAlertCheckTime ? format(new Date(stats.lastAlertCheckTime), 'MM-dd HH:mm') : '-',
      icon: Bell,
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 系统统计 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* 清理任务配置 */}
      <Card>
        <CardHeader>
          <CardTitle>不活跃会话清理</CardTitle>
          <CardDescription>定期检查和关闭超时未关闭的会话</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {updateSuccess && (
            <Alert className="border-success/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  配置已更新成功。需要重启服务器才能生效新的轮询间隔设置。
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* 配置表单 */}
          <div className="space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold text-foreground">
                清理任务执行间隔（分钟）
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                系统每隔多长时间检查一次不活跃的会话（范围：1-1440）
              </p>
              <div className="relative mt-2">
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={cleanupInterval}
                  onChange={(e) => setCleanupInterval(e.target.value ? Number(e.target.value) : '')}
                  className="border-border transition-all"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-foreground">
                判定不活跃的时间（小时）
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                如果会话没有新日志超过此时间，将被标记为已结束（范围：1-720）
              </p>
              <div className="relative mt-2">
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={inactiveHours}
                  onChange={(e) => setInactiveHours(e.target.value ? Number(e.target.value) : '')}
                  className="border-border transition-all"
                />
              </div>
            </div>

            {/* 当前配置显示 */}
            {config && (
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">当前配置</p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span>清理任务执行间隔：<span className="font-mono font-semibold">{config.sessionCleanupInterval}</span> 分钟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span>判定不活跃时间：<span className="font-mono font-semibold">{config.inactiveSessionHours}</span> 小时</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              onClick={handleUpdateConfig}
              disabled={isUpdating || cleanupInterval === '' || inactiveHours === ''}
              className="disabled:opacity-50"
            >
              {isUpdating ? '保存中...' : '保存配置'}
            </Button>
            <Button
              variant="outline"
              onClick={handleManualCleanup}
              disabled={isCleaningUp}
              className="shadow-sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isCleaningUp ? 'animate-spin' : ''}`} />
              {isCleaningUp ? '清理中...' : '立即执行清理'}
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-primary">
                  💡 小贴士
                </h4>
                <p className="mt-1 text-xs text-primary">
                  修改清理任务执行间隔后需要重启服务器才能生效。修改判定不活跃时间可立即生效，新规则会在下次清理时应用。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
