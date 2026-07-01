/**
 * 日志相关类型定义
 */

export enum LogType {
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
  SYSTEM_LOG = 'system_log',
  CUSTOM = 'custom',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface Log {
  _id: string;
  logId: string;
  sessionId: string;
  logType: LogType;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogFilters {
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

export interface LogsResponse {
  success: boolean;
  data: {
    logs: Log[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LogStats {
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  byGame: Record<string, number>;
  byDevice?: number; // 活跃设备数
  recentErrors: number;
  recentWarnings: number;
  timeRange: {
    start: string;
    end: string;
  };
}
