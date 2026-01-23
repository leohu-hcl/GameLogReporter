'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';

/**
 * 告警列表页面
 */
export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">告警</h1>

          {/* 临时内容 */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-muted-foreground">告警列表组件开发中...</p>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
