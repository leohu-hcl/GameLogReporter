'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Bell } from 'lucide-react';

/**
 * 告警列表页面
 */
export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <PageHeader title="告警" description="系统告警和通知管理" />

          <EmptyState
            icon={Bell}
            title="告警列表组件开发中..."
            description="即将为您呈现完整的告警管理功能"
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
