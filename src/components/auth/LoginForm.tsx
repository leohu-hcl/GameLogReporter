'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * 登录表单组件
 */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('请填写所有必填字段');
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);

      // 如果勾选"记住我"，存储用户信息
      if (formData.rememberMe) {
        localStorage.setItem('lastEmail', formData.email);
      }

      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">登录</CardTitle>
        <CardDescription>输入您的凭证以继续</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 演示提示 */}
          <Alert className="bg-blue-50 border-blue-200 text-blue-900">
            <AlertDescription className="text-sm">
              📝 <strong>演示账号：</strong><br />
              邮箱: admin@gamelog.com | 密码: Admin@123456
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱或用户名
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: !!checked }))}
              disabled={loading}
            />
            <label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
              记住我
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '登录中...' : '登录'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            还没有账户？{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              注册
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link href="/auth/reset-password" className="text-primary hover:underline">
              忘记密码？
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
