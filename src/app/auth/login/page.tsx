'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * 登录页面
 */
export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex rounded-full bg-gray-200 dark:bg-gray-800 p-4 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-400 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <LoginForm />
    </div>
  );
}
