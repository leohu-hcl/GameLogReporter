import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'destructive' | 'warning' | 'info' | 'success';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** 语义色调 */
  tone?: Tone;
  /** @deprecated 兼容旧用法，传入则忽略，改用 tone */
  iconColor?: string;
  onClick?: () => void;
  description?: string;
}

const TONE: Record<Tone, { text: string; bg: string; bar: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/12', bar: 'bg-primary' },
  destructive: { text: 'text-destructive', bg: 'bg-destructive/12', bar: 'bg-destructive' },
  warning: { text: 'text-warning', bg: 'bg-warning/15', bar: 'bg-warning' },
  info: { text: 'text-info', bg: 'bg-info/12', bar: 'bg-info' },
  success: { text: 'text-success', bg: 'bg-success/12', bar: 'bg-success' },
};

/**
 * 统计卡片 — mission-control 面板
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'primary',
  onClick,
  description,
}: StatCardProps) {
  const t = TONE[tone];

  return (
    <div
      className={cn(
        'panel panel-hover group relative overflow-hidden p-5',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      {...(onClick && { role: 'button', tabIndex: 0 })}
    >
      {/* top accent bar */}
      <span
        className={cn(
          'absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100',
          t.bar
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow truncate">{title}</p>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-md', t.bg, t.text)}>
          <Icon className="h-[22px] w-[22px]" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
