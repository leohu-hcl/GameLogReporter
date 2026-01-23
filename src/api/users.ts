/**
 * 用户管理 API 服务
 */

import { apiClient } from './client';
import { User } from '@/types';

export interface UserListParams {
  page: number;
  limit: number;
  searchQuery?: string;
  role?: 'admin' | 'editor' | 'viewer';
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  isActive?: boolean;
}

export const userService = {
  /**
   * 获取用户列表（带搜索、过滤和分页）
   */
  getUsers: async (
    page = 1,
    limit = 10,
    searchQuery?: string,
    role?: 'admin' | 'editor' | 'viewer',
    isActive?: boolean
  ): Promise<UserListResponse['data']> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (role) {
      params.append('role', role);
    }
    if (isActive !== undefined) {
      params.append('isActive', String(isActive));
    }

    const response = await apiClient.get<UserListResponse>(
      `/users?${params.toString()}`
    );
    
    // 转换响应格式：从扁平结构到嵌套结构
    const { users, total, page: p, limit: l, totalPages } = response.data;
    return {
      users,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages
      }
    };
  },

  /**
   * 获取用户详情
   */
  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<{
      success: boolean;
      data: User;
    }>(`/users/${userId}`);
    return response.data;
  },

  /**
   * 创建用户
   */
  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<{
      success: boolean;
      data: User;
    }>('/users', data);
    return response.data;
  },

  /**
   * 更新用户
   */
  updateUser: async (
    userId: string,
    data: UpdateUserRequest
  ): Promise<User> => {
    const response = await apiClient.put<{
      success: boolean;
      data: User;
    }>(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * 删除用户
   */
  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};
