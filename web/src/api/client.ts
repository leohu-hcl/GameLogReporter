import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config/env';
import { ApiError } from '@/types/common';

/**
 * API 客户端配置和实例
 */

class ApiClient {
  private instance: AxiosInstance;
  // 单飞刷新：并发 401 共用同一个刷新请求，避免重复刷新与竞态
  private refreshPromise: Promise<string> | null = null;

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

  private async responseErrorInterceptor(error: any): Promise<any> {
    if (!error.response) {
      console.error('Network error:', error);
      throw new ApiError('Network connection failed', 0, 0);
    }

    const { status, data } = error.response;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // 认证端点自身的 401/4xx 是“凭证错误”，不是“会话过期”——直接抛给调用方显示，
    // 不触发刷新/登出跳转，否则登录失败会被当成 token 过期而重定向回登录页。
    const url = originalRequest.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/verify-and-reset');

    // 处理 401 - 尝试用 refreshToken 刷新一次，成功则重放原请求
    if (status === 401 && typeof window !== 'undefined' && !originalRequest._retried && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        originalRequest._retried = true;
        try {
          const newToken = await this.refreshAccessToken(refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.instance.request(originalRequest);
        } catch {
          this.forceLogout();
        }
      } else {
        this.forceLogout();
      }
    }

    throw new ApiError(data?.message || 'API Error', data?.code || status, status, data?.details);
  }

  /**
   * 单飞刷新 accessToken：并发请求复用同一个 in-flight Promise。
   */
  private refreshAccessToken(refreshToken: string): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = axios
        .post<{ data: { accessToken: string } }>(`${config.apiUrl}/auth/refresh`, { refreshToken })
        .then((res) => {
          const accessToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', accessToken);
          return accessToken;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private forceLogout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // 携带当前路径，登录后可回跳
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/login?redirect=${redirect}`;
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
