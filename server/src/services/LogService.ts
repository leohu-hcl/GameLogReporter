import { v4 as uuidv4 } from 'uuid';
import { Log, ILog, LogType, LogLevel } from '../models/Log';
import { Session } from '../models/Session';
import { Device } from '../models/Device';
import { setupLogger } from '../config/logger';
import { broadcastLogToGame, broadcastLogToSession } from './WebSocketService';

const logger = setupLogger();

export interface CreateLogDto {
  sessionId: string;
  logType: LogType;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  timestamp?: Date;
}

export interface GetLogsQuery {
  page: number;
  limit: number;
  logType?: string;
  level?: string;
  sessionId?: string;
  startTime?: string;
  endTime?: string;
  search?: string;
  metadataFilters?: Record<string, any>;
}

export async function createLog(data: CreateLogDto): Promise<ILog> {
  try {
    const logData = {
      ...data,
      logId: uuidv4(),
      timestamp: data.timestamp ? (typeof data.timestamp === 'string' || typeof data.timestamp === 'number' ? new Date(data.timestamp) : data.timestamp) : new Date()
    };

    const log = new Log(logData);
    await log.save();

    // 使用会话ID广播给WebSocket客户端
    broadcastLogToSession(data.sessionId, log);

    return log;
  } catch (error) {
    logger.error('Error creating log:', error);
    throw error;
  }
}

export async function createLogsBatch(logs: CreateLogDto[]): Promise<{ created: number; failed: number }> {
  try {
    const logDocuments = logs.map(data => ({
      ...data,
      logId: uuidv4(),
      timestamp: data.timestamp ? (typeof data.timestamp === 'string' || typeof data.timestamp === 'number' ? new Date(data.timestamp) : data.timestamp) : new Date()
    }));

    const result = await Log.insertMany(logDocuments, { ordered: false });
    
    // 广播新日志 - 使用会话ID
    const sessionIds = [...new Set(logs.map(log => log.sessionId))];
    for (const sessionId of sessionIds) {
      const sessionLogs = result.filter(log => log.sessionId === sessionId);
      sessionLogs.forEach(log => broadcastLogToSession(sessionId, log));
    }

    return {
      created: result.length,
      failed: logs.length - result.length
    };
  } catch (error: any) {
    // MongoDB批量插入可能部分成功
    const created = error.insertedDocs?.length || 0;
    logger.error('Error creating logs batch:', error);
    logger.error('Failed logs data:', logs);
    return {
      created,
      failed: logs.length - created
    };
  }
}

export async function getLogs(query: GetLogsQuery): Promise<{
  logs: ILog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const { page, limit, logType, level, sessionId, startTime, endTime, search, metadataFilters } = query;

    // 构建查询条件
    const filter: any = {};

    if (logType) {
      filter.logType = logType;
    }

    if (level) {
      filter.level = level;
    }

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    if (startTime || endTime) {
      filter.timestamp = {};
      if (startTime) {
        filter.timestamp.$gte = new Date(startTime);
      }
      if (endTime) {
        filter.timestamp.$lte = new Date(endTime);
      }
    }

    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { stackTrace: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 添加元数据筛选条件
    if (metadataFilters && typeof metadataFilters === 'object') {
      Object.keys(metadataFilters).forEach(key => {
        const value = metadataFilters[key];
        if (value !== undefined && value !== null) {
          // 支持嵌套字段查询 (如 metadata.deviceId)
          if (key.startsWith('metadata.')) {
            filter[key] = value;
          } else {
            // 如果不是嵌套字段，则直接添加到filter中
            filter[key] = value;
          }
        }
      });
    }

    // 查询总数
    const total = await Log.countDocuments(filter);

    // 查询数据
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      logs: logs as ILog[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Error getting logs:', error);
    throw error;
  }
}

export async function getLogById(id: string): Promise<(ILog & { version?: string }) | null> {
  try {
    const log = await Log.findById(id).lean();
    if (!log) return null;

    // 版本号存在会话上（非日志本身），查询单条日志时 join 进来供详情页展示。
    const session = await Session.findOne({ sessionId: log.sessionId })
      .select('version')
      .lean();
    return { ...log, version: session?.version };
  } catch (error) {
    logger.error('Error getting log by id:', error);
    throw error;
  }
}

export interface LogStats {
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  byGame: Record<string, number>;
  recentErrors: number;
  recentWarnings: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export async function getLogStats(query: {
  sessionId?: string;
  startTime?: string;
  endTime?: string;
}): Promise<LogStats> {
  try {
    const { sessionId, startTime, endTime } = query;

    const filter: any = {};
    if (sessionId) filter.sessionId = sessionId;
    if (startTime || endTime) {
      filter.timestamp = {};
      if (startTime) filter.timestamp.$gte = new Date(startTime);
      if (endTime) filter.timestamp.$lte = new Date(endTime);
    }

    // 如果没有指定时间范围，默认最近24小时
    if (!startTime && !endTime) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filter.timestamp = { $gte: yesterday, $lte: now };
    }

    const timeRange = {
      start: startTime ? new Date(startTime) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: endTime ? new Date(endTime) : new Date()
    };

    // 并行执行多个聚合查询
    const [total, byType, byLevel, bySession, recentErrors, recentWarnings, deviceCount] = await Promise.all([
      Log.countDocuments(filter),
      Log.aggregate([
        { $match: filter },
        { $group: { _id: '$logType', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: filter },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: filter },
        { $group: { _id: '$sessionId', count: { $sum: 1 } } }
      ]),
      Log.countDocuments({ ...filter, level: LogLevel.ERROR }),
      Log.countDocuments({ ...filter, level: LogLevel.WARNING }),
      // 统计活跃设备数：先获取时间范围内的会话，再计数唯一设备
      Session.aggregate([
        {
          $match: {
            startTime: {
              $gte: filter.timestamp?.$gte || new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: filter.timestamp?.$lte || new Date()
            }
          }
        },
        { $group: { _id: '$deviceId' } },
        { $count: 'total' }
      ])
    ]);

    // 转换聚合结果
    const byTypeMap: Record<string, number> = {};
    byType.forEach((item: any) => {
      byTypeMap[item._id] = item.count;
    });

    const byLevelMap: Record<string, number> = {};
    byLevel.forEach((item: any) => {
      byLevelMap[item._id] = item.count;
    });

    // 将sessionId统计转换为会话统计，如果需要可以进一步查询游戏ID
    const bySessionMap: Record<string, number> = {};
    bySession.forEach((item: any) => {
      bySessionMap[item._id] = item.count;
    });

    // 获取活跃设备数（从聚合结果中提取）
    const activeDevices = deviceCount && deviceCount.length > 0 ? deviceCount[0].total : 0;

    return {
      total,
      byType: byTypeMap,
      byLevel: byLevelMap,
      byGame: bySessionMap,  // 字段名保留为 byGame 以兼容旧前端，实际按会话统计
      byDevice: activeDevices,  // 活跃设备数
      recentErrors,
      recentWarnings,
      timeRange
    };
  } catch (error) {
    logger.error('Error getting log stats:', error);
    throw error;
  }
}
