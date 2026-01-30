'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface UserFormProps {
  user?: User | null;
  isLoading?: boolean;
  onSubmit: (data: FormData) => Promise<void> | void;
  onCancel: () => void;
}

interface FormData {
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
}

/**
 * 用户编辑表单组件
 */
export function UserForm({ user, isLoading = false, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // 编辑时不显示密码
        role: user.role as 'admin' | 'editor' | 'viewer',
        isActive: user.isActive,
      });
    }
  }, [user]);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      newErrors.username = '用户名长度需要3-50个字符';
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    // 创建用户时密码必填，编辑时可选
    if (!user && !formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = '密码长度至少6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: FormData & { password?: string } = { ...formData };
      // 编辑时如果密码为空，则不提交密码字段
      if (!submitData.password && user) {
        delete submitData.password;
      }
      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除该字段的错误
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as 'admin' | 'editor' | 'viewer',
    }));
  };

  const handleActiveChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 用户名 */}
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">用户名</label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="输入用户名"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading || isSubmitting}
            className={errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.username && (
            <p className="text-xs text-red-600">{errors.username}</p>
          )}
        </div>

        {/* 邮箱 */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="输入邮箱"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading || isSubmitting}
            className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 密码 */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user ? '密码 (留空不修改)' : '密码'}
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={user ? '留空不修改密码' : '输入密码'}
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading || isSubmitting}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* 角色 */}
        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">用户角色</label>
          <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading || isSubmitting}>
            <SelectTrigger id="role">
              <SelectValue placeholder="选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">管理员 (Admin)</SelectItem>
              <SelectItem value="editor">编辑者 (Editor)</SelectItem>
              <SelectItem value="viewer">查看者 (Viewer)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 启用状态 */}
      {user && (
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={handleActiveChange}
            disabled={isLoading || isSubmitting}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            启用账户
          </label>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? '保存中...' : user ? '保存修改' : '创建用户'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isSubmitting}
          className="flex-1"
        >
          取消
        </Button>
      </div>
    </form>
  );
}

export default UserForm;
