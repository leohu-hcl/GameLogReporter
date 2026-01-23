'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { UserForm } from '@/components/users/UserForm';
import { useCreateUser } from '@/hooks/useUsersQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 创建用户页面
 */
export default function CreateUserPage() {
  const router = useRouter();
  const { mutate: createUser, isPending, error: mutationError } = useCreateUser();

  const handleSubmit = async (data: any) => {
    return new Promise<void>((resolve) => {
      createUser(
        {
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role,
        },
        {
          onSuccess: () => {
            router.push('/users');
            resolve();
          },
          onError: () => {
            resolve();
          },
        }
      );
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 返回按钮 */}
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>

          {/* 标题 */}
          <div>
            <h1 className="text-3xl font-bold">创建新用户</h1>
            <p className="text-gray-500 text-sm mt-1">添加新用户到系统中</p>
          </div>

          {/* 错误提示 */}
          {mutationError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutationError instanceof Error
                  ? mutationError.message
                  : '创建用户失败，请检查输入信息后重试'}
              </AlertDescription>
            </Alert>
          )}

          {/* 表单卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>用户信息</CardTitle>
              <CardDescription>填写以下信息创建新用户</CardDescription>
            </CardHeader>
            <CardContent>
              <UserForm
                isLoading={isPending}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
