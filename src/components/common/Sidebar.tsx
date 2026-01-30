'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, Bell, Users, Settings, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

/**
 * 侧边栏导航
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    {
      title: '仪表板',
      href: '/dashboard',
      icon: BarChart3,
      badge: null,
    },
    {
      title: '日志',
      href: '/logs',
      icon: FileText,
      badge: null,
    },
    {
      title: '设备',
      href: '/devices',
      icon: Smartphone,
      badge: null,
    },
    {
      title: '告警',
      href: '/alerts',
      icon: Bell,
      badge: null,
    },
    ...(user?.role === 'admin'
      ? [
          {
            title: '用户管理',
            href: '/users',
            icon: Users,
            badge: null,
          },
        ]
      : []),
    {
      title: '设置',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* 移动端背景遮罩 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed md:relative top-0 left-0 w-64 h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 z-50 transition-transform duration-300 md:translate-x-0 flex flex-col border-r border-gray-200 dark:border-gray-800',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 侧边栏头部 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">GameLog</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 菜单项 */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 text-gray-600 dark:text-gray-300',
                    active
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
              <Users className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
