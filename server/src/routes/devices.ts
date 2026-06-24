import { Router } from 'express';
import {
  getAllDevices,
  getDeviceWithSessions,
  getDeviceStats,
  getDevicesSummary,
  updateDevice,
  deleteDevice,
  getDeviceList,
} from '../controllers/deviceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * 设备相关的API路由
 */

/**
 * GET /api/devices
 * 获取所有设备列表
 */
router.get('/', authenticateToken, getAllDevices);

/**
 * GET /api/devices/summary
 * 获取设备统计摘要
 */
router.get('/summary', authenticateToken, getDevicesSummary);

/**
 * GET /api/devices/list
 * 获取设备列表（用于下拉框）
 */
router.get('/list', authenticateToken, getDeviceList);

/**
 * GET /api/devices/:deviceId
 * 获取单个设备详情及其会话列表
 */
router.get('/:deviceId', authenticateToken, getDeviceWithSessions);

/**
 * GET /api/devices/:deviceId/stats
 * 获取设备统计信息
 */
router.get('/:deviceId/stats', authenticateToken, getDeviceStats);

/**
 * PUT /api/devices/:deviceId
 * 更新设备信息
 */
router.put('/:deviceId', authenticateToken, updateDevice);

/**
 * DELETE /api/devices/:deviceId
 * 删除设备及其所有数据
 */
router.delete('/:deviceId', authenticateToken, deleteDevice);

export default router;
