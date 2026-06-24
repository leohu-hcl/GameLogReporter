import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 开发环境使用更宽松的限制
const isDevelopment = process.env.NODE_ENV !== 'production';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 默认15分钟
const maxRequests = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? '1000' : '100'), 
  10
);

export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 开发环境跳过速率限制检查
  skip: (req: Request) => isDevelopment && req.ip === '::1' || req.ip === '127.0.0.1',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
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
