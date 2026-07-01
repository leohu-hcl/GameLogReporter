import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as logService from '../services/LogService';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../models/Session';
import { Device } from '../models/Device';

export async function createLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await logService.createLog(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

export async function createLogsBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new AppError('Logs array is required and cannot be empty', 400);
    }

    const result = await logService.createLogsBatch(logs);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 50, logType, level, sessionId, startTime, endTime, search } = req.query;
    
    // 解析元数据筛选条件
    let metadataFilters: Record<string, any> = {};
    if (req.query.metadataFilters) {
      try {
        metadataFilters = JSON.parse(req.query.metadataFilters as string);
      } catch (e) {
        // 如果解析失败，忽略元数据筛选
      }
    }
    
    const result = await logService.getLogs({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      logType: logType as string,
      level: level as string,
      sessionId: sessionId as string,
      startTime: startTime as string,
      endTime: endTime as string,
      search: search as string,
      metadataFilters
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLogById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const log = await logService.getLogById(id);
    
    if (!log) {
      throw new AppError('Log not found', 404);
    }

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

export async function getLogStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId, startTime, endTime } = req.query;
    
    const stats = await logService.getLogStats({
      sessionId: sessionId as string,
      startTime: startTime as string,
      endTime: endTime as string
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId, deviceInfo, gameId, userId } = req.body;
    
    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }
    
    // 检查或创建设备记录
    let device = await Device.findOne({ deviceId });
    if (!device) {
      // 创建新设备
      device = new Device({
        deviceId,
        ...deviceInfo
      });
      await device.save();
    } else {
      // 更新设备最后访问时间
      device.lastSeen = new Date();
      if (deviceInfo) {
        // 更新设备信息
        Object.assign(device, deviceInfo);
      }
      await device.save();
    }
    
    // 同一设备开启新会话即视为旧会话作废：先关闭该设备所有仍 active 的会话，
    // 避免悬挂的"进行中"会话堆积（最新会话的关闭仍由客户端结束或清理任务负责）。
    await Session.updateMany(
      { deviceId, status: 'active' },
      { status: 'ended', endTime: new Date() }
    );

    // 创建新会话
    const sessionId = uuidv4();
    const session = new Session({
      sessionId,
      deviceId,
      gameId,
      userId
    });

    await session.save();
    
    res.status(201).json({
      success: true,
      data: {
        sessionId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 设备心跳：刷新 Device.lastSeen，使派生的活跃状态保持在线。
 * Unity 客户端定时调用，无需认证。
 */
export async function heartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    // 只更新已存在设备的 lastSeen；设备记录由 createSession 负责创建
    await Device.updateOne({ deviceId }, { lastSeen: new Date() });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * 补写会话版本号：客户端真实版本（包版本/资源版本等）异步就绪后回填。
 * 版本在会话创建时尚未加载（StreamingAssets/Addressables 晚于建会话），故单独上报。
 * Unity 客户端调用，无需认证。
 */
export async function updateSessionVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { version } = req.body;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    await Session.updateOne({ sessionId }, { version });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
