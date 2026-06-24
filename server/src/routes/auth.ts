import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 公开接口
router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/refresh', userController.refreshToken);
router.post('/logout', userController.logout);

// 需要认证的接口
router.get('/me', authenticateToken, userController.getCurrentUser);
router.post('/change-password', authenticateToken, userController.changePassword);
router.post('/reset-password', userController.resetPassword);
router.post('/verify-and-reset', userController.verifyAndResetPassword);

export default router;
