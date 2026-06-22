'use client';

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/api/auth';

interface PasswordFormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type VisibilityState = {
  oldPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
};

/**
 * 安全设置组件 - 密码管理
 */
export function SecuritySettings() {
  const { logout } = useAuth();
  const [form, setForm] = useState<PasswordFormState>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [visibility, setVisibility] = useState<VisibilityState>({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleVisibility = (field: keyof VisibilityState) => {
    setVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      return '所有字段都是必填的';
    }

    if (form.newPassword.length < 8) {
      return '新密码至少需要 8 个字符';
    }

    if (form.newPassword !== form.confirmPassword) {
      return '两次输入的新密码不一致';
    }

    if (form.oldPassword === form.newPassword) {
      return '新密码不能与旧密码相同';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.changePassword(form.oldPassword, form.newPassword);
      setSuccess(true);
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
      // 3 秒后重新登录
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '修改密码失败，请重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 密码管理卡片 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">修改密码</h3>
        </div>

        {/* 提示信息 */}
        {success && (
          <Alert className="mb-6 border-success/30 bg-success/10">
            <AlertCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              密码修改成功！系统将在 3 秒后重新登录。
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-destructive/30 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 旧密码 */}
          <div>
            <label htmlFor="oldPassword" className="mb-2 block text-sm font-medium text-foreground">
              当前密码
            </label>
            <div className="relative">
              <input
                id="oldPassword"
                name="oldPassword"
                type={visibility.oldPassword ? 'text' : 'password'}
                value={form.oldPassword}
                onChange={handleInputChange}
                placeholder="输入当前密码"
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-card px-3 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:bg-muted"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('oldPassword')}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
              >
                {visibility.oldPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-foreground">
              新密码
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={visibility.newPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={handleInputChange}
                placeholder="输入新密码（至少 8 个字符）"
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-card px-3 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:bg-muted"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('newPassword')}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
              >
                {visibility.newPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              密码需要至少 8 个字符
            </p>
          </div>

          {/* 确认新密码 */}
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-foreground">
              确认新密码
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={visibility.confirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleInputChange}
                placeholder="再次输入新密码"
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-card px-3 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:bg-muted"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('confirmPassword')}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
              >
                {visibility.confirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || success}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? '修改中...' : '修改密码'}
            </Button>
            {success && (
              <div className="flex items-center text-success">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* 安全建议 */}
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
        <h4 className="mb-2 font-semibold text-primary">密码安全建议</h4>
        <ul className="space-y-1 text-sm text-primary">
          <li>• 使用至少 8 个字符的密码</li>
          <li>• 包含大小写字母、数字和特殊字符</li>
          <li>• 定期更换密码以保护账户安全</li>
          <li>• 不要与他人分享你的密码</li>
        </ul>
      </div>
    </div>
  );
}
