'use client';

import { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteDialogProps {
  user: User | null;
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 删除用户确认对话框
 */
export function DeleteDialog({
  user,
  open,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除用户</DialogTitle>
          <DialogDescription>
            你确定要删除用户 <span className="font-semibold">{user?.username}</span> 吗？
          </DialogDescription>
        </DialogHeader>

        {/* 用户信息 */}
        {user && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 space-y-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">用户名：</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">邮箱：</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">角色：</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {user.role === 'admin'
                  ? '管理员'
                  : user.role === 'editor'
                    ? '编辑者'
                    : '查看者'}
              </span>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          <p className="font-medium mb-1">⚠️ 注意：</p>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>此操作不可撤销</li>
            <li>用户的所有权限将被移除</li>
            <li>用户将无法再登录系统</li>
          </ul>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteDialog;
