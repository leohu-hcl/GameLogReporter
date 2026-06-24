import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// 需要认证和管理员权限的用户管理接口
router.get('/', authenticateToken, requireRole('admin'), userController.getUsers);
router.post('/', authenticateToken, requireRole('admin'), userController.createUser);
router.get('/:id', authenticateToken, requireRole('admin'), userController.getUserById);
router.put('/:id', authenticateToken, requireRole('admin'), userController.updateUser);
router.delete('/:id', authenticateToken, requireRole('admin'), userController.deleteUser);

export default router;
