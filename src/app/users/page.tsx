'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { Pagination } from '@/components/common/Pagination';
import { useUsersList, useDeleteUser } from '@/hooks/useUsersQueries';
import { DeleteDialog } from '@/components/users/DeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';
import { User } from '@/types';

/**
 * 用户管理列表页面
 */
export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState(''); // 临时输入
  const [searchQuery, setSearchQuery] = useState(''); // 提交后的查询
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer' | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const isActive = selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined;

  const { data, isLoading, error } = useUsersList(
    page,
    limit,
    searchQuery,
    selectedRole as any || undefined,
    isActive
  );

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

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

  if (error || !data) {
    return (
      <ProtectedRoute>
        <Layout>
          <Alert variant="destructive">
            <AlertDescription>
              {error?.message || '加载用户列表失败，请稍后重试'}
            </AlertDescription>
          </Alert>
        </Layout>
      </ProtectedRoute>
    );
  }

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value as any);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value as any);
    setPage(1);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        },
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    const roleLabels: Record<string, string> = {
      admin: '管理员',
      editor: '编辑者',
      viewer: '查看者',
    };
    return (
      <Badge className={roleColors[role]}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理员',
      editor: '编辑者',
      viewer: '查看者',
    };
    return labels[role] || role;
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-4">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">用户管理</h1>
              <p className="text-gray-500 text-sm mt-1">管理系统用户和权限</p>
            </div>
            <Button onClick={() => router.push('/users/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              创建用户
            </Button>
          </div>

          {/* 过滤和搜索 */}
          <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap gap-3">
              {/* 搜索框 */}
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索用户名或邮箱..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-64"
                />
                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="h-8 px-4"
                >
                  搜索
                </Button>
                {searchQuery && (
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                  >
                    清空筛选
                  </Button>
                )}
              </div>

              {/* 角色过滤 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">用户角色</label>
                <Select value={selectedRole || 'all'} onValueChange={(value) => handleRoleFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="editor">编辑者</SelectItem>
                    <SelectItem value="viewer">查看者</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 状态过滤 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">账户状态</label>
                <Select value={selectedStatus || 'all'} onValueChange={(value) => handleStatusFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 用户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>
                共 {data.pagination.total} 个用户
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <div className="flex items-center justify-center min-h-96 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium">没有找到用户</p>
                    <p className="text-sm">尝试调整搜索条件或创建新用户</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          用户名
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          邮箱
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          角色
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          状态
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          最后登录
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((user) => (
                        <tr key={user._id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={user.isActive ? 'outline' : 'secondary'}>
                              {user.isActive ? '启用' : '禁用'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleString()
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/users/${user._id}`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 分页 */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={data.pagination.totalPages}
                    total={data.pagination.total}
                    limit={limit}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 删除确认对话框 */}
          <DeleteDialog
            user={selectedUser}
            open={deleteDialogOpen}
            isLoading={isDeleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setSelectedUser(null);
            }}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
