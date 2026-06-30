/**
 * 认证 API 服务
 */

import { apiClient } from './client';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types';

export const authService = {
  /**
   * 用户登录
   */
  login: async (email: string, password: string): Promise<AuthResponse['data']> => {
    return apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    } as LoginRequest).then(res => res.data);
  },

  /**
   * 用户注册
   */
  register: async (data: RegisterRequest): Promise<AuthResponse['data']> => {
    return apiClient.post<AuthResponse>('/auth/register', data).then(res => res.data);
  },

  /**
   * 用户登出
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout', {});
  },

  /**
   * 刷新 Token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return response.data as User;
  },

  /**
   * 请求密码重置
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { email });
  },

  /**
   * 验证和重置密码
   */
  verifyAndResetPassword: async (token: string, password: string): Promise<void> => {
    // 服务端字段名为 newPassword
    await apiClient.post('/auth/verify-and-reset', { token, newPassword: password });
  },

  /**
   * 修改密码（需要验证旧密码）
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },
};

export default authService;
