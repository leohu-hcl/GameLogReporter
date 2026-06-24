/**
 * 用户管理相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/users';
import { User } from '@/types';

/**
 * 获取用户列表 Hook
 */
export function useUsersList(
  page = 1,
  limit = 10,
  searchQuery?: string,
  role?: 'admin' | 'editor' | 'viewer',
  isActive?: boolean
) {
  return useQuery({
    queryKey: ['users', page, limit, searchQuery, role, isActive],
    queryFn: async () => {
      return await userService.getUsers(page, limit, searchQuery, role, isActive);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取用户详情 Hook
 */
export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return await userService.getUserById(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 创建用户 Mutation Hook
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof userService.createUser>[0]) => {
      return await userService.createUser(data);
    },
    onSuccess: () => {
      // 重新获取用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * 更新用户 Mutation Hook
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Parameters<typeof userService.updateUser>[1] }) => {
      return await userService.updateUser(userId, data);
    },
    onSuccess: (_, variables) => {
      // 重新获取用户列表和该用户的详情
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
    },
  });
}

/**
 * 删除用户 Mutation Hook
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await userService.deleteUser(userId);
    },
    onSuccess: () => {
      // 重新获取用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
