import mongoose, { Schema, Document } from 'mongoose';

export enum LogType {
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
  SYSTEM_LOG = 'system_log',
  CUSTOM = 'custom'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ILog extends Document {
  logId: string;
  sessionId: string;  // 现在强制关联到会话
  logType: LogType;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  timestamp: Date;
  clientVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      ref: 'Session',
      index: true
    },
    logType: {
      type: String,
      enum: Object.values(LogType),
      required: true,
      index: true
    },
    level: {
      type: String,
      enum: Object.values(LogLevel),
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    stackTrace: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    tags: {
      type: [String],
      default: []
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date()
    },
    clientVersion: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: 'logs'
  }
);

// 创建复合索引以提高查询性能
LogSchema.index({ sessionId: 1, timestamp: -1 });
LogSchema.index({ logType: 1, timestamp: -1 });
LogSchema.index({ level: 1, timestamp: -1 });
LogSchema.index({ sessionId: 1, logType: 1, timestamp: -1 });

export const Log = mongoose.model<ILog>('Log', LogSchema);
