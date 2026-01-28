import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as alertController from '../controllers/alertController';

const router = Router();

// 所有告警接口都需要认证
router.use(authenticateToken);

router.get('/', alertController.getAlertRules);
router.post('/', alertController.createAlertRule);
router.get('/:id', alertController.getAlertRuleById);
router.put('/:id', alertController.updateAlertRule);
router.delete('/:id', alertController.deleteAlertRule);
router.get('/history/list', alertController.getAlertHistory);

export default router;
