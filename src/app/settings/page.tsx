'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { useAuth } from '@/context/AuthContext';

/**
 * 系统设置页面
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <PageHeader title="设置" description="管理系统配置和偏好设置" />

          <Tabs defaultValue={isAdmin ? 'system' : 'general'} className="w-full">
            <TabsList className="w-full overflow-x-auto whitespace-nowrap">
              {isAdmin && <TabsTrigger value="system">系统设置</TabsTrigger>}
              <TabsTrigger value="general">通用设置</TabsTrigger>
              <TabsTrigger value="appearance">外观设置</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
            </TabsList>

            {/* 系统设置 - 仅管理员 */}
            {isAdmin && (
              <TabsContent value="system" className="mt-6">
                <SystemSettings />
              </TabsContent>
            )}

            {/* 通用设置 */}
            <TabsContent value="general" className="mt-6">
              <GeneralSettings />
            </TabsContent>

            {/* 外观设置 */}
            <TabsContent value="appearance" className="mt-6">
              <ThemeSettings />
            </TabsContent>

            {/* 安全设置 */}
            <TabsContent value="security" className="mt-6">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
