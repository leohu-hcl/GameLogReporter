'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, BarChart3, FileText, Bell, Users, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

/**
 * 顶部导航栏
 */
export function Header({ onSidebarToggle, sidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
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
          <h1 className="text-xl font-bold text-primary">GameLogReporter</h1>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-4">
          {/* 用户信息 */}
          {user && (
            <>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </p>
              </div>

              {/* 登出按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="登出"
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
