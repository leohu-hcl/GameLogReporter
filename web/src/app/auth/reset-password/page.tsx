'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { authService } from '@/api/auth';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSuccess('如果该邮箱已注册，重置令牌将发送到您的邮箱，请查收');
      toast.success('重置请求已提交');
      setStep('reset');
    } catch (err) {
      const message = err instanceof Error ? err.message : '请求失败，请重试';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!resetToken) {
      setError('请输入重置令牌');
      return;
    }

    if (!passwords.password || !passwords.confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyAndResetPassword(resetToken, passwords.password);
      setSuccess('密码重置成功，请用新密码登录');
      toast.success('密码重置成功');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '密码重置失败，请重试';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">重置密码</CardTitle>
          <CardDescription>
            {step === 'request' ? '输入您的邮箱地址以接收重置链接' : '输入重置令牌和新密码'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-success/30 bg-success/10">
              <AlertDescription className="text-success">{success}</AlertDescription>
            </Alert>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '发送中...' : '发送重置链接'}
              </Button>

              <div className="text-center text-sm">
                返回{' '}
                <Link href="/auth/login" className="text-primary hover:underline">
                  登录
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="resetToken" className="text-sm font-medium">
                  重置令牌
                </label>
                <Input
                  id="resetToken"
                  type="text"
                  placeholder="从邮箱中复制令牌"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  新密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入新密码"
                  value={passwords.password}
                  onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认新密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '重置中...' : '重置密码'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('request');
                  setResetToken('');
                  setPasswords({ password: '', confirmPassword: '' });
                }}
              >
                返回
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
