import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { setupLogger } from '../config/logger';

const logger = setupLogger();

// 自定义morgan token
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    return JSON.stringify(req.body).substring(0, 200);
  }
  return '';
});

// 创建morgan中间件
const morganMiddleware = morgan(
  ':method :url :status :response-time ms - :res[content-length] :body',
  {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      }
    }
  }
);

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  morganMiddleware(req, res, next);
}
