'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from 'recharts';

export interface DistributionDatum {
  /** 用于跳转/区分的原始键 */
  key: string;
  /** 显示名 */
  label: string;
  value: number;
  /** CSS 颜色（支持 var(--token)） */
  color: string;
}

interface DistributionChartProps {
  data: DistributionDatum[];
  onBarClick?: (key: string) => void;
  height?: number;
}

interface TooltipPayload {
  payload: DistributionDatum;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-md">
      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        {d.label}
      </p>
      <p className="font-display text-lg font-bold tabular-nums text-foreground">{d.value}</p>
    </div>
  );
}

/**
 * 通用横向分布条形图 — 颜色读自主题 token，自动跟随深/浅色
 */
export function DistributionChart({ data, onBarClick, height = 240 }: DistributionChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={56}
          tickLine={false}
          axisLine={false}
          tick={{
            fill: 'var(--muted-foreground)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          isAnimationActive
          animationDuration={650}
          onClick={(d: unknown) => {
            const datum = d as DistributionDatum;
            if (onBarClick && datum?.key) onBarClick(datum.key);
          }}
          className={onBarClick ? 'cursor-pointer' : ''}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={entry.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="tabular-nums"
            fill="var(--foreground)"
            fontSize={13}
            fontFamily="var(--font-display)"
            fontWeight={700}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DistributionChart;
