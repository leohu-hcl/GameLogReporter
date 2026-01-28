import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/SessionService';
import { AppError } from '../middleware/errorHandler';

/**
 * 获取单个会话详情，包含该会话的所有日志
 */
export async function getSessionWithLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const result = await SessionService.getSessionWithLogs(
      sessionId as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取设备的所有会话列表
 */
export async function getSessionsByDevice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const result = await SessionService.getSessionsByDevice(
      deviceId as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新会话信息
 */
export async function updateSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const session = await SessionService.updateSession(sessionId, updateData);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 结束会话
 */
export async function endSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const session = await SessionService.endSession(sessionId);

    res.json({
      success: true,
      data: session,
      message: 'Session ended successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除会话及其所有日志
 */
export async function deleteSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const result = await SessionService.deleteSession(sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 关闭不活跃的会话
 */
export async function closeInactiveSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { hoursInactive = 24 } = req.query;

    const result = await SessionService.closeInactiveSessions(parseInt(hoursInactive as string));

    res.json({
      success: true,
      data: result,
      message: `Closed ${result.closedCount} inactive sessions`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取会话统计信息
 */
export async function getSessionStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.query;

    const stats = await SessionService.getSessionStats(deviceId as string | undefined);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取设备最近的会话
 */
export async function getRecentSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { deviceId } = req.params;
    const { limit = 5 } = req.query;

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const sessions = await SessionService.getRecentSessionsForDevice(
      deviceId as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}
