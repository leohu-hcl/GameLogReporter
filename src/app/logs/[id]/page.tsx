'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { LogDetail } from '@/components/logs/LogDetail';

/**
 * 日志详情页面
 */
export default function LogDetailPage() {
  const params = useParams();
  const logId = params.id as string;

  return (
    <ProtectedRoute>
      <Layout>
        <LogDetail logId={logId} />
      </Layout>
    </ProtectedRoute>
  );
}
