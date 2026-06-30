import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 开发环境使用更宽松的限制
const isDevelopment = process.env.NODE_ENV !== 'production';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 默认15分钟
const maxRequests = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? '1000' : '500'),
  10
);

// 回环 + 局域网网段豁免：内网调试不受全局限流影响，公网仍受限。
const isTrustedIp = (ip?: string): boolean => {
  if (!ip) return false;
  const v4 = ip.replace(/^::ffff:/, ''); // 归一化 IPv4-mapped IPv6
  return (
    v4 === '::1' ||
    v4 === '127.0.0.1' ||
    v4.startsWith('10.') ||
    v4.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v4) // 172.16.0.0 – 172.31.255.255
  );
};

export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 开发环境跳过全部；生产环境跳过可信内网 IP
  skip: (req: Request) => isDevelopment || isTrustedIp(req.ip),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// 认证专用限流：只对“失败”的尝试计数，正常登录不消耗额度，
// 既挡暴力破解又不影响普通用户反复登录。
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: isDevelopment ? 1000 : 20, // 15 分钟内最多 20 次失败
  skipSuccessfulRequests: true, // 2xx/3xx 不计数
  message: {
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => isDevelopment || isTrustedIp(req.ip),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many login attempts, please try again later.'
    });
  }
});

// 日志上报专用的更宽松的速率限制
export const logRateLimiter = rateLimit({
  windowMs: 60000, // 1分钟
  max: 1000, // 允许更多请求
  message: {
    error: 'Too many log requests, please try again later.'
  }
});
