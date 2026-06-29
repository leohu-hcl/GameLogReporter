/**
 * 环境变量配置
 */

/**
 * 解析浏览器访问 server 的地址。
 * 优先用完整环境变量（NEXT_PUBLIC_API_URL）；否则用当前页面 host + 指定端口推导，
 * 这样换 IP / 换机器 / 上 https 都无需重新构建。
 */
function resolveUrl(fullUrl: string | undefined, port: string, path = ''): string {
  if (fullUrl) return fullUrl;
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${port}${path}`;
  }
  return `http://localhost:${port}${path}`;
}

const SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT || '3010';

export const config = {
  apiUrl: resolveUrl(process.env.NEXT_PUBLIC_API_URL, SERVER_PORT, '/api'),
  socketUrl: resolveUrl(process.env.NEXT_PUBLIC_SOCKET_URL, SERVER_PORT),
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

export default config;
