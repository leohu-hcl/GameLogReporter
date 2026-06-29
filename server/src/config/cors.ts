// 局域网网段：localhost / 127.x / 10.x / 172.16-31.x / 192.168.x
const LAN_REGEX = /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

// CORS_ORIGIN 白名单（逗号分隔）；用于放行非局域网的固定域名
const whitelist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

/** 是否放行该 origin：局域网地址或白名单内地址。 */
export function isAllowedOrigin(origin?: string): boolean {
  // 无 origin（Postman/curl/服务端调用）放行
  if (!origin) return true;
  if (LAN_REGEX.test(origin)) return true;
  return whitelist.includes(origin);
}
