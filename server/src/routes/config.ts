import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// 系统配置（内存存储，仅用于演示）
const systemConfig = {
  sessionCleanupInterval: 60, // 分钟
  inactiveSessionHours: 24, // 小时
  alertCheckInterval: 5, // 分钟
  statsUpdateInterval: 30, // 秒
  lastCleanupTime: new Date(),
  lastAlertCheckTime: new Date(),
};

/**
 * 获取系统配置
 */
router.get('/system-config', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    res.json({
      success: true,
      data: systemConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system config',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 更新系统配置
 */
router.put('/system-config', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { sessionCleanupInterval, inactiveSessionHours } = req.body;

    // 验证输入
    if (sessionCleanupInterval !== undefined) {
      if (typeof sessionCleanupInterval !== 'number' || sessionCleanupInterval < 1 || sessionCleanupInterval > 1440) {
        return res.status(400).json({
          success: false,
          message: 'sessionCleanupInterval must be between 1 and 1440 minutes',
        });
      }
      systemConfig.sessionCleanupInterval = sessionCleanupInterval;
    }

    if (inactiveSessionHours !== undefined) {
      if (typeof inactiveSessionHours !== 'number' || inactiveSessionHours < 1 || inactiveSessionHours > 720) {
        return res.status(400).json({
          success: false,
          message: 'inactiveSessionHours must be between 1 and 720 hours',
        });
      }
      systemConfig.inactiveSessionHours = inactiveSessionHours;
    }

    res.json({
      success: true,
      message: 'System config updated successfully',
      data: systemConfig,
      note: 'Note: Changes to cleanup intervals require server restart to take effect',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update system config',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 手动触发会话清理
 */
router.post('/cleanup-inactive-sessions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { SessionService } = await import('../services/SessionService');
    const hours = req.body.hours || systemConfig.inactiveSessionHours;

    const result = await SessionService.closeInactiveSessions(hours);
    systemConfig.lastCleanupTime = new Date();

    res.json({
      success: true,
      message: `Cleanup completed. Closed ${result.closedCount} inactive sessions.`,
      data: {
        closedCount: result.closedCount,
        cleanupTime: systemConfig.lastCleanupTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger session cleanup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 获取系统统计信息
 */
router.get('/system-stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { Session } = await import('../models/Session');
    const activeSessions = await Session.countDocuments({ status: 'active' });
    const totalSessions = await Session.countDocuments();

    res.json({
      success: true,
      data: {
        activeSessions,
        totalSessions,
        lastCleanupTime: systemConfig.lastCleanupTime,
        lastAlertCheckTime: systemConfig.lastAlertCheckTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
