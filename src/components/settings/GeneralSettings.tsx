'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/SettingsContext';
import { List, Info } from 'lucide-react';

/**
 * 通用设置组件
 */
export function GeneralSettings() {
  const { pageSizes, setPageSize, pageSizeOptions } = useSettings();

  const sections = [
    { key: 'logs', label: '日志列表' },
    { key: 'sessionLogs', label: '会话日志' },
    { key: 'devices', label: '设备列表' },
    { key: 'deviceSessions', label: '设备会话' },
    { key: 'users', label: '用户列表' },
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2.5">
              <List className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <CardTitle className="text-2xl">通用设置</CardTitle>
              <CardDescription className="text-sm">
                管理应用的通用偏好
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              分页条数配置
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              可分别设置不同列表的每页显示条数
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sections.map((section) => (
                <div key={section.key} className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {section.label}
                  </label>
                  <Select
                    value={String(pageSizes[section.key])}
                    onValueChange={(value) => setPageSize(section.key, Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择每页条数" />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} 条/页
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* 提示信息 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                  💡 小贴士
                </h4>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  设置会自动保存并即时生效，对应列表会从第一页重新加载。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
