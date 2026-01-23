'use client';

import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { UserForm } from '@/components/users/UserForm';
import { useUserById, useUpdateUser } from '@/hooks/useUsersQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 用户编辑页面
 */
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { data: user, isLoading, error } = useUserById(userId);
  const { mutate: updateUser, isPending, error: mutationError } = useUpdateUser();

  const handleSubmit = async (data: any) => {
    return new Promise<void>((resolve) => {
      updateUser(
        {
          userId,
          data: {
            username: data.username,
            email: data.email,
            role: data.role,
            isActive: data.isActive,
            ...(data.password && { password: data.password }), // 仅在提供密码时包含
          },
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex h-96 items-center justify-center">
            <LoadingSpinner />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !user) {
    return (
      <ProtectedRoute>
        <Layout>
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : '加载用户信息失败，请稍后重试'}
            </AlertDescription>
          </Alert>
        </Layout>
      </ProtectedRoute>
    );
  }

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
            <h1 className="text-3xl font-bold">编辑用户</h1>
            <p className="text-gray-500 text-sm mt-1">修改用户信息和权限</p>
          </div>

          {/* 错误提示 */}
          {mutationError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutationError instanceof Error
                  ? mutationError.message
                  : '更新用户失败，请检查输入信息后重试'}
              </AlertDescription>
            </Alert>
          )}

          {/* 表单卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{user.username}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserForm
                user={user}
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
