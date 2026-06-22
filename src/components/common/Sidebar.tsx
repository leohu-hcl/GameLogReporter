'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, Bell, Users, Settings, Smartphone, X, Terminal } from 'lucide-react';
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
    { title: '仪表板', code: 'OVERVIEW', href: '/dashboard', icon: BarChart3 },
    { title: '日志', code: 'LOGS', href: '/logs', icon: FileText },
    { title: '设备', code: 'DEVICES', href: '/devices', icon: Smartphone },
    { title: '告警', code: 'ALERTS', href: '/alerts', icon: Bell },
    ...(user?.role === 'admin'
      ? [{ title: '用户管理', code: 'USERS', href: '/users', icon: Users }]
      : []),
    { title: '设置', code: 'CONFIG', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* 移动端背景遮罩 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:relative md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-5">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground glow-primary">
              <Terminal className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tracking-wide text-foreground">
                GAMELOG
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Reporter
              </span>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 菜单项 */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="eyebrow px-3 pb-2">导航</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all',
                    active
                      ? 'bg-sidebar-accent text-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                  )}
                >
                  {/* active indicator bar */}
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                    )}
                  />
                  <Icon
                    className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  <span className="flex-1 font-medium">{item.title}</span>
                  <span
                    className={cn(
                      'font-mono text-[0.6rem] tracking-wider transition-opacity',
                      active
                        ? 'text-primary/70'
                        : 'text-muted-foreground/40 group-hover:text-muted-foreground/70'
                    )}
                  >
                    {item.code}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 用户信息 */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <span className="font-display text-sm font-bold">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold text-foreground">{user?.username}</p>
              <p className="truncate font-mono text-[0.65rem] text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <span className="pulse-dot inline-block h-2 w-2 shrink-0 rounded-full bg-success text-success" />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
