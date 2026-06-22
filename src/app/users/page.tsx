'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterSelect } from '@/components/common/FilterSelect';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useUsersList, useDeleteUser } from '@/hooks/useUsersQueries';
import { DeleteDialog } from '@/components/users/DeleteDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Trash2, Edit2, Plus, Users } from 'lucide-react';
import { User } from '@/types';
import { useSettings } from '@/context/SettingsContext';

/**
 * 用户管理列表页面
 */
export default function UsersPage() {
  const router = useRouter();
  const { getPageSize } = useSettings();
  const pageSize = getPageSize('users');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(''); // 临时输入
  const [searchQuery, setSearchQuery] = useState(''); // 提交后的查询
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer' | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const isActive = selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined;

  const { data, isLoading, error } = useUsersList(
    page,
    pageSize,
    searchQuery,
    selectedRole as any || undefined,
    isActive
  );

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

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
      admin: 'bg-destructive/15 text-destructive border border-destructive/30',
      editor: 'bg-info/15 text-info border border-info/30',
      viewer: 'bg-muted text-muted-foreground border border-border',
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
        <div className="space-y-6">
          {/* 页面标题 */}
          <PageHeader 
            title="用户管理" 
            description="管理系统用户和权限"
          >
            <Button onClick={() => router.push('/users/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              创建用户
            </Button>
          </PageHeader>

          <FilterBar>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="搜索用户名或邮箱..."
              showClearButton={Boolean(searchQuery)}
            />
            <FilterSelect
              label="用户角色"
              value={selectedRole || 'all'}
              onChange={(value) => handleRoleFilter(value === 'all' ? '' : value)}
              options={[
                { value: 'all', label: '全部角色' },
                { value: 'admin', label: '管理员' },
                { value: 'editor', label: '编辑者' },
                { value: 'viewer', label: '查看者' },
              ]}
            />
            <FilterSelect
              label="账户状态"
              value={selectedStatus || 'all'}
              onChange={(value) => handleStatusFilter(value === 'all' ? '' : value)}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '禁用' },
              ]}
            />
          </FilterBar>

          <DataTable
            title="用户列表"
            description={`共 ${data?.pagination?.total || 0} 个用户`}
            data={data?.users || []}
            keyExtractor={(user) => user._id}
            emptyState={
              <EmptyState
                icon={Users}
                title="没有找到用户"
                description="尝试调整搜索条件或创建新用户"
              />
            }
            columns={[
              {
                key: 'username',
                label: '用户名',
                render: (user) => (
                  <span className="text-sm font-medium text-foreground">
                    {user.username}
                  </span>
                ),
              },
              {
                key: 'email',
                label: '邮箱',
                render: (user) => (
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                ),
              },
              {
                key: 'role',
                label: '角色',
                render: (user) => getRoleBadge(user.role),
              },
              {
                key: 'status',
                label: '状态',
                render: (user) => (
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? '启用' : '禁用'}
                  </Badge>
                ),
              },
              {
                key: 'lastLogin',
                label: '最后登录',
                render: (user) => (
                  <span className="text-sm text-muted-foreground">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: '操作',
                align: 'right',
                render: (user) => (
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
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {(data?.pagination?.totalPages || 0) > 1 && (
            <div className="mt-2">
              <Pagination
                currentPage={page}
                totalPages={data?.pagination?.totalPages || 1}
                total={data?.pagination?.total || 0}
                limit={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}

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
