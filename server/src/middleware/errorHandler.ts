import { Request, Response, NextFunction } from 'express';
import { setupLogger } from '../config/logger';

const logger = setupLogger();

export class AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode || 500;
    this.isOperational = true;
    
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // 记录错误
  logger.error('Error:', {
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // 生产环境不暴露堆栈信息
  const response: any = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
}
