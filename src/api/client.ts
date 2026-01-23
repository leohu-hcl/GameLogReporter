import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config/env';
import { ApiError } from '@/types/common';

/**
 * API 客户端配置和实例
 */

class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = config.apiUrl) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => this.requestInterceptor(config),
      (error) => this.requestErrorInterceptor(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => this.responseInterceptor(response),
      (error) => this.responseErrorInterceptor(error)
    );
  }

  private requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // 从 localStorage 获取 token
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求 ID 用于追踪
    config.headers['X-Request-ID'] = this.generateRequestId();

    return config;
  }

  private requestErrorInterceptor(error: any): Promise<never> {
    console.error('Request error:', error);
    return Promise.reject(error);
  }

  private responseInterceptor(response: any): any {
    // 返回响应数据
    return response.data;
  }

  private async responseErrorInterceptor(error: any): Promise<never> {
    if (!error.response) {
      console.error('Network error:', error);
      throw new ApiError('Network connection failed', 0, 0);
    }

    const { status, data } = error.response;

    // 处理 401 - Token 过期
    if (status === 401) {
      // TODO: 实现 Token 刷新逻辑
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }

    throw new ApiError(data?.message || 'API Error', data?.code || status, status, data?.details);
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 通用请求方法
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get<T, T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post<T, T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put<T, T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete<T, T>(url, config);
  }
}

export const apiClient = new ApiClient();

export default apiClient;
