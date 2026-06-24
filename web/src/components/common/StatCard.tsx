import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  /** 迷你趋势线数据（按时间顺序） */
  trend?: number[];
}

const TONE: Record<Tone, { text: string; bg: string; bar: string; fill: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/12', bar: 'bg-primary', fill: 'var(--primary)' },
  destructive: { text: 'text-destructive', bg: 'bg-destructive/12', bar: 'bg-destructive', fill: 'var(--destructive)' },
  warning: { text: 'text-warning', bg: 'bg-warning/15', bar: 'bg-warning', fill: 'var(--warning)' },
  info: { text: 'text-info', bg: 'bg-info/12', bar: 'bg-info', fill: 'var(--info)' },
  success: { text: 'text-success', bg: 'bg-success/12', bar: 'bg-success', fill: 'var(--success)' },
};

/** 环比：序列最后一天 vs 前一天 */
function computeDelta(trend?: number[]): number | null {
  if (!trend || trend.length < 2) return null;
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  if (prev === 0) return last === 0 ? 0 : null; // 无基准，不显示百分比
  return Math.round(((last - prev) / prev) * 100);
}

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
  trend,
}: StatCardProps) {
  const t = TONE[tone];
  const delta = computeDelta(trend);
  const hasTrend = !!trend && trend.length >= 2;

  const DeltaIcon = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

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

      {/* 趋势线 */}
      {hasTrend && (
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex items-center gap-1 font-mono text-[0.7rem] text-muted-foreground">
            <DeltaIcon className={cn('h-3.5 w-3.5', t.text)} />
            {delta !== null ? (
              <span>
                {delta > 0 ? '+' : ''}
                {delta}% <span className="text-muted-foreground/60">较昨日</span>
              </span>
            ) : (
              <span className="text-muted-foreground/60">近 7 天</span>
            )}
          </div>
          <div className="h-10 w-24 shrink-0">
            <Sparkline data={trend} color={t.fill} height={40} />
          </div>
        </div>
      )}
    </div>
  );
}
