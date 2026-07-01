'use client';

import { usePathname } from 'next/navigation';
import { Menu, LogOut, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useSocketStatus } from '@/hooks/useSocketStatus';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

const ROUTE_LABELS: { match: string; label: string; code: string }[] = [
  { match: '/dashboard', label: '仪表板', code: 'OVERVIEW' },
  { match: '/logs', label: '日志', code: 'LOGS' },
  { match: '/devices', label: '设备', code: 'DEVICES' },
  // 会话无顶级菜单，归属到设备（设备 → 会话 → 日志），与侧边栏高亮保持一致
  { match: '/sessions', label: '设备', code: 'DEVICES' },
  { match: '/alerts', label: '告警', code: 'ALERTS' },
  { match: '/users', label: '用户管理', code: 'USERS' },
  { match: '/settings', label: '设置', code: 'CONFIG' },
];

/**
 * 顶部导航栏
 */
export function Header({ onSidebarToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const current =
    ROUTE_LABELS.find((r) => pathname.startsWith(r.match)) ?? ROUTE_LABELS[0];

  const roleLabel =
    user?.role === 'admin' ? '管理员' : user?.role === 'editor' ? '编辑者' : '查看者';

  // 实时连接状态（Socket.io），驱动下方在线指示
  const online = useSocketStatus();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* 左侧 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">/</span>
            <h1 className="font-display text-lg font-semibold tracking-wide text-foreground">
              {current.label}
            </h1>
            <span className="hidden rounded border border-border bg-muted px-2 py-0.5 font-mono text-[0.6rem] tracking-wider text-muted-foreground sm:inline-block">
              {current.code}
            </span>
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-3">
          {/* 实时状态（反映真实 Socket 连接） */}
          <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 lg:flex">
            <Activity className={cn('h-3.5 w-3.5', online ? 'text-success' : 'text-muted-foreground')} />
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {online ? '系统在线' : '连接断开'}
            </span>
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                online ? 'pulse-dot bg-success text-success' : 'bg-muted-foreground'
              )}
            />
          </div>

          {user && (
            <>
              <div className="hidden items-center gap-3 rounded-md border border-border bg-card px-3 py-1.5 md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/15 text-primary">
                  <span className="font-display text-xs font-bold">
                    {user.username?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold text-foreground">{user.username}</p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* 登出按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="登出"
                className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
