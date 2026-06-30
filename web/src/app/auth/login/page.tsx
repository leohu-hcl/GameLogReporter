'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 inline-flex rounded-md border border-border bg-card p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        </div>
        <p className="eyebrow">加载中…</p>
      </div>
    </div>
  );
}

/**
 * 登录页面内容
 */
function LoginPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // 登录后回跳目标（由 ProtectedRoute 在拦截时写入）
  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(redirect);
    }
  }, [isAuthenticated, isLoading, router, redirect]);

  if (isLoading) {
    return <LoginLoading />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* atmospheric accent glows */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'var(--primary)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--info)' }}
      />
      <div className="relative z-10 w-full max-w-md animate-rise">
        <LoginForm redirectTo={redirect} />
      </div>
    </div>
  );
}

/**
 * 登录页面
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
