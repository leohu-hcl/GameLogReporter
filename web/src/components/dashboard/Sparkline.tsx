'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { useId } from 'react';

interface SparklineProps {
  data: number[];
  /** 线条/填充颜色，支持 var(--token) */
  color?: string;
  width?: number | `${number}%`;
  height?: number;
}

/**
 * 迷你趋势线 — 无坐标轴/网格/提示，仅一条带渐变填充的折线
 */
export function Sparkline({
  data,
  color = 'var(--primary)',
  width = '100%',
  height = 40,
}: SparklineProps) {
  const id = useId().replace(/:/g, '');
  const gradientId = `spark-${id}`;

  if (!data || data.length < 2) {
    return <div style={{ height }} />;
  }

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={700}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default Sparkline;
