import { Router } from 'express';
import {
  getSessionWithLogs,
  getSessionsByDevice,
  updateSession,
  endSession,
  deleteSession,
  getSessionStats,
  getRecentSessions,
  closeInactiveSessions,
} from '../controllers/sessionController';
import { createSession, heartbeat, updateSessionVersion } from '../controllers/logController';
import { authenticateToken } from '../middleware/auth';
import { logRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * 会话相关的API路由
 */

/**
 * POST /api/sessions
 * 创建新会话（Unity客户端调用，不需要认证）
 */
router.post('/', logRateLimiter, createSession);

/**
 * POST /api/sessions/heartbeat
 * 设备心跳，刷新 lastSeen（Unity客户端调用，不需要认证）
 * 注意：放在 /:sessionId 之前，避免 'heartbeat' 被当作 sessionId
 */
router.post('/heartbeat', logRateLimiter, heartbeat);

/**
 * POST /api/sessions/:sessionId/version
 * 补写会话版本号（Unity客户端版本异步就绪后回填，不需要认证）
 * 注意：放在 /:sessionId 之前不必要（这里是子路径），但与其他客户端接口归在一处
 */
router.post('/:sessionId/version', logRateLimiter, updateSessionVersion);

/**
 * POST /api/sessions/admin/close-inactive
 * 关闭不活跃的会话（管理员操作）
 * 注意：这个路由要放在 /:sessionId 之前，避免 'admin' 被当作 sessionId
 */
router.post('/admin/close-inactive', authenticateToken, closeInactiveSessions);

/**
 * GET /api/sessions/:sessionId
 * 获取单个会话详情，包含该会话的所有日志
 */
router.get('/:sessionId', authenticateToken, getSessionWithLogs);

/**
 * GET /api/sessions/device/:deviceId
 * 获取设备的所有会话列表
 */
router.get('/device/:deviceId', authenticateToken, getSessionsByDevice);

/**
 * GET /api/sessions/device/:deviceId/recent
 * 获取设备最近的会话
 */
router.get('/device/:deviceId/recent', authenticateToken, getRecentSessions);

/**
 * GET /api/sessions/stats
 * 获取会话统计信息
 */
router.get('/stats', authenticateToken, getSessionStats);

/**
 * PUT /api/sessions/:sessionId
 * 更新会话信息
 */
router.put('/:sessionId', authenticateToken, updateSession);

/**
 * POST /api/sessions/:sessionId/end
 * 结束会话
 */
router.post('/:sessionId/end', endSession);

/**
 * DELETE /api/sessions/:sessionId
 * 删除会话及其所有日志
 */
router.delete('/:sessionId', authenticateToken, deleteSession);

export default router;
