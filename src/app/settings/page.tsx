'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';

/**
 * 系统设置页面
 */
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">设置</h1>

          {/* 临时内容 */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-muted-foreground">系统设置组件开发中...</p>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
