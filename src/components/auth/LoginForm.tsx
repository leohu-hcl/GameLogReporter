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
import { Terminal } from 'lucide-react';

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
    <Card className="w-full max-w-md border-border glow-primary">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground glow-primary">
          <Terminal className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <p className="eyebrow">GAMELOG · REPORTER</p>
        <CardTitle className="font-display text-2xl tracking-tight">欢迎回来</CardTitle>
        <CardDescription>登录到游戏日志管理控制台</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {/* 演示提示 */}
          <Alert className="border-info/30 bg-info/10">
            <AlertDescription className="text-sm text-info">
              <strong>演示账号：</strong><br />
              邮箱: admin@gamelog.com | 密码: Admin@123456
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
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
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
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
              className="h-11"
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
            <label htmlFor="rememberMe" className="cursor-pointer text-sm font-medium text-muted-foreground">
              记住我
            </label>
          </div>

          <Button type="submit" disabled={loading} className="h-11 w-full">
            {loading ? '登录中...' : '登录'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            还没有账户？{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              注册
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link href="/auth/reset-password" className="font-medium text-primary hover:underline">
              忘记密码？
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
