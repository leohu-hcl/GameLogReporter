'use client';

import { useTheme } from '@/context/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

/**
 * 主题设置组件 - 现代化设计
 */
export function ThemeSettings() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: '亮色模式',
      icon: Sun,
      description: '清爽明亮的视觉体验',
      borderColor: 'border-amber-200 dark:border-amber-900',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      value: 'dark' as const,
      label: '暗色模式',
      icon: Moon,
      description: '护眼舒适的深色界面',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      value: 'system' as const,
      label: '跟随系统',
      icon: Monitor,
      description: '自动适配系统主题',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <Sun className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">主题外观</CardTitle>
              <CardDescription className="text-sm">
                选择您喜欢的应用主题
                {theme === 'system' && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info border border-info/30">
                    当前：{effectiveTheme === 'dark' ? '暗色' : '亮色'}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 主题选择卡片 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.value;

              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`
                    group rounded-xl border p-6 text-left transition-colors
                    ${isSelected
                      ? `${t.borderColor} bg-background`
                      : 'border-border hover:bg-muted/50'
                    }
                  `}
                >
                  {/* 选中指示器 */}
                  {isSelected && (
                    <div className="flex items-center justify-end">
                      <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                    </div>
                  )}

                  {/* 图标 */}
                  <div className="flex flex-col items-center space-y-4">
                    <div
                      className={`rounded-xl p-4 ${t.iconBg}`}
                    >
                      <Icon className={`h-8 w-8 ${t.iconColor}`} />
                    </div>

                    {/* 文字 */}
                    <div className="text-center">
                      <p className={`font-semibold text-base ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                        {t.label}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                  </div>

                </button>
              );
            })}
          </div>

          {/* 主题预览区域 */}
          <Card className="overflow-hidden border border-dashed border-border">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-sm font-semibold text-foreground">
                🎨 主题预览
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* 卡片预览 */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-2 h-3 w-24 rounded-full bg-muted" />
                <div className="h-2 w-full rounded-full bg-muted/50" />
              </div>

              {/* 按钮预览 */}
              <div className="flex flex-wrap gap-2">
                <div className="h-8 rounded-lg bg-blue-500 px-4 shadow-sm" />
                <div className="h-8 rounded-lg bg-green-500 px-4 shadow-sm" />
                <div className="h-8 rounded-lg bg-purple-500 px-4 shadow-sm" />
                <div className="h-8 rounded-lg border border-border bg-card px-4" />
              </div>

              {/* 颜色调色板 */}
              <div className="flex gap-2 pt-2">
                <div className="h-10 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-10 flex-1 rounded-lg bg-gray-300 dark:bg-gray-600" />
                <div className="h-10 flex-1 rounded-lg bg-gray-400 dark:bg-gray-500" />
                <div className="h-10 flex-1 rounded-lg bg-gray-500 dark:bg-gray-400" />
              </div>

              <p className="pt-1 text-center text-xs text-muted-foreground">
                ✨ 当前主题下的UI元素效果
              </p>
            </CardContent>
          </Card>

          {/* 提示信息 */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-primary">
                  💡 小贴士
                </h4>
                <p className="mt-1 text-xs text-primary">
                  主题设置会自动保存，下次访问时自动应用。选择"跟随系统"可让应用随系统主题自动切换。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
