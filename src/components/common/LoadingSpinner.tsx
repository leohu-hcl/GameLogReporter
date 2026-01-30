'use client';

/**
 * 加载动画组件
 * 简洁的脉冲动画效果
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 text-center">
        <div className="flex justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse"></div>
          <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse [animation-delay:0.2s]"></div>
          <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse [animation-delay:0.4s]"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
