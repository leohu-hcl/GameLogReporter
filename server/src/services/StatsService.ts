import { Log, LogType, LogLevel } from '../models/Log';
import { setupLogger } from '../config/logger';
import { broadcastStatsUpdate } from './WebSocketService';

const logger = setupLogger();

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

// 获取错误趋势数据（按小时）
export async function getErrorTrend(
  sessionId?: string,
  hours: number = 24
): Promise<TimeSeriesData[]> {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filter: any = {
      timestamp: { $gte: startTime },
      level: LogLevel.ERROR
    };

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    const logs = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:00:00',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return logs.map((item: any) => ({
      timestamp: new Date(item._id),
      value: item.count
    }));
  } catch (error) {
    logger.error('Error getting error trend:', error);
    throw error;
  }
}

// 获取日志类型分布
export async function getLogTypeDistribution(sessionId?: string, hours: number = 24): Promise<ChartData> {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filter: any = {
      timestamp: { $gte: startTime }
    };

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    const distribution = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$logType',
          count: { $sum: 1 }
        }
      }
    ]);

    const labels = Object.values(LogType);
    const data = labels.map(type => {
      const item = distribution.find((d: any) => d._id === type);
      return item ? item.count : 0;
    });

    return {
      labels,
      datasets: [{
        label: 'Log Count',
        data
      }]
    };
  } catch (error) {
    logger.error('Error getting log type distribution:', error);
    throw error;
  }
}

// 获取性能指标趋势
export async function getPerformanceMetrics(
  sessionId?: string,
  hours: number = 24
): Promise<{
  fps: TimeSeriesData[];
  memory: TimeSeriesData[];
  loadTime: TimeSeriesData[];
}> {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filter: any = {
      timestamp: { $gte: startTime },
      logType: LogType.PERFORMANCE
    };

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    const logs = await Log.find(filter)
      .sort({ timestamp: 1 })
      .lean();

    const fps: TimeSeriesData[] = [];
    const memory: TimeSeriesData[] = [];
    const loadTime: TimeSeriesData[] = [];

    logs.forEach((log: any) => {
      const metadata = log.metadata || {};
      const timestamp = log.timestamp;

      if (metadata.fps !== undefined) {
        fps.push({ timestamp, value: metadata.fps });
      }

      if (metadata.memoryMB !== undefined) {
        memory.push({ timestamp, value: metadata.memoryMB });
      }

      if (metadata.loadTimeMs !== undefined) {
        loadTime.push({ timestamp, value: metadata.loadTimeMs });
      }
    });

    return { fps, memory, loadTime };
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    throw error;
  }
}

// 获取实时统计（用于仪表板）
export async function getRealtimeStats(sessionId?: string): Promise<{
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  onlineUsers: number;
  recentLogs: any[];
}> {
  try {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    const filter: any = {
      timestamp: { $gte: last5Minutes }
    };

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    const [totalLogs, errorCount, warningCount, recentLogs] = await Promise.all([
      Log.countDocuments(filter),
      Log.countDocuments({ ...filter, level: LogLevel.ERROR }),
      Log.countDocuments({ ...filter, level: LogLevel.WARNING }),
      Log.find(filter)
        .sort({ timestamp: -1 })
        .limit(10)
        .lean()
    ]);

    // 统计在线用户（最近5分钟有活动的唯一用户）
    const uniqueUsers = await Log.distinct('userId', {
      ...filter,
      userId: { $exists: true, $ne: null }
    });
    const onlineUsers = uniqueUsers.length;

    return {
      totalLogs,
      errorCount,
      warningCount,
      onlineUsers,
      recentLogs: recentLogs as any[]
    };
  } catch (error) {
    logger.error('Error getting realtime stats:', error);
    throw error;
  }
}

// 定时更新实时统计并广播
export function startRealtimeStatsBroadcast(intervalSeconds: number = 30): void {
  logger.info(`Starting realtime stats broadcast with ${intervalSeconds} second interval`);

  setInterval(async () => {
    try {
      const stats = await getRealtimeStats();
      broadcastStatsUpdate({ type: 'stats', data: stats });
    } catch (error) {
      logger.error('Error broadcasting stats:', error);
    }
  }, intervalSeconds * 1000);
}
