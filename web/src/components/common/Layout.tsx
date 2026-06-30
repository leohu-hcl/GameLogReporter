'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 主布局组件
 */
export function Layout({ children }: LayoutProps) {
  // 桌面端侧边栏由 md:translate-x-0 强制常显，该 state 仅控制移动端抽屉。
  // 默认 false：移动端首屏不再被抽屉遮挡。
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 侧边栏 */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

        {/* 内容区 */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
