import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { logRateLimiter } from '../middleware/rateLimiter';
import * as logController from '../controllers/logController';

const router = Router();

// 日志上报接口（不需要认证，但需要速率限制）
router.post('/', logRateLimiter, logController.createLog);
router.post('/batch', logRateLimiter, logController.createLogsBatch);

// 日志查询接口（需要认证）
router.get('/', authenticateToken, logController.getLogs);
router.get('/stats', authenticateToken, logController.getLogStats);
router.get('/:id', authenticateToken, logController.getLogById);

export default router;
