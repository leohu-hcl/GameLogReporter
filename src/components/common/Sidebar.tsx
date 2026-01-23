'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, Bell, Users, Settings, Smartphone, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
  open: boolean;
}

/**
 * 侧边栏导航
 */
export function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(open);

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
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed md:relative top-0 left-0 w-64 h-screen bg-slate-900 text-white z-50 transition-transform duration-300 md:translate-x-0 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 侧边栏头部 */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold">
            GameLog
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden text-white hover:bg-slate-800"
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
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-2 text-slate-300',
                    active 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{item.title}</span>
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
        <div className="p-4 border-t border-slate-700">
          <div className="text-sm">
            <p className="font-medium">{user?.username}</p>
            <p className="text-slate-400 text-xs">
              {user?.email}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
