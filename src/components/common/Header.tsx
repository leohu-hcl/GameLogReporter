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
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between h-16 px-6">
        {/* 左侧 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">GameLogReporter</h1>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-4">
          {/* 用户信息 */}
          {user && (
            <>
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
                  <Users className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑者' : '查看者'}
                  </p>
                </div>
              </div>

              {/* 登出按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="登出"
                className="hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all rounded-xl"
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
