'use client';

/**
 * 加载动画组件
 * 简洁的脉冲动画效果
 */
export function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-5 text-center">
        <div className="flex items-end justify-center gap-1.5">
          <div className="h-6 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0s]" />
          <div className="h-9 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.15s]" />
          <div className="h-5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.3s]" />
          <div className="h-8 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.45s]" />
          <div className="h-4 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.6s]" />
        </div>
        <p className="eyebrow">加载中…</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
