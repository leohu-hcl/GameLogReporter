import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// 公开接口（认证类加专用限流，只对失败尝试计数）
router.post('/login', authLimiter, userController.login);
router.post('/register', authLimiter, userController.register);
router.post('/refresh', userController.refreshToken);
router.post('/logout', userController.logout);

// 需要认证的接口
router.get('/me', authenticateToken, userController.getCurrentUser);
router.post('/change-password', authenticateToken, userController.changePassword);
router.post('/reset-password', authLimiter, userController.resetPassword);
router.post('/verify-and-reset', authLimiter, userController.verifyAndResetPassword);

export default router;
