'use client';

import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string; // 支持 var(--token)
}

interface StatusDonutProps {
  data: DonutSegment[];
  /** 中心大字（默认显示总数） */
  centervalue?: string | number;
  centerLabel?: string;
  size?: number;
}

/**
 * 状态环形图 — 中心显示总数，右侧图例带数值
 * 颜色读自主题 token，自动跟随深/浅色
 */
export function StatusDonut({ data, centervalue, centerLabel, size = 180 }: StatusDonutProps) {
  // 过滤掉 0 值段，避免 paddingAngle 在空段处留下缺口
  const segments = data.filter((d) => d.value > 0);
  const total = segments.reduce((sum, d) => sum + d.value, 0);
  const center = centervalue ?? total;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height: size }}
      >
        暂无数据
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.46}
              paddingAngle={segments.length > 1 ? 3 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={650}
            >
              {segments.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* 中心标签 */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold tabular-nums text-foreground">
            {center}
          </span>
          {centerLabel && (
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {/* 图例 */}
      <ul className="space-y-2">
        {data.map((entry) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <li key={entry.key} className="flex items-center gap-2.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">{entry.label}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {entry.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default StatusDonut;
