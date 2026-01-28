import mongoose, { Schema, Document } from 'mongoose';

export enum AlertCondition {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne'
}

export enum AlertNotificationType {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

export interface IAlertRule extends Document {
  name: string;
  description?: string;
  sessionId?: string; // 如果为空，则应用于所有会话
  enabled: boolean;
  condition: {
    logType?: string;
    level?: string;
    field: string; // 要监控的字段
    operator: AlertCondition;
    threshold: number;
    timeWindow: number; // 时间窗口（分钟）
  };
  notification: {
    type: AlertNotificationType;
    recipients?: string[]; // 邮箱地址或webhook URL
    webhookUrl?: string;
  };
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    sessionId: {
      type: String,
      index: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    condition: {
      logType: String,
      level: String,
      field: {
        type: String,
        required: true
      },
      operator: {
        type: String,
        enum: Object.values(AlertCondition),
        required: true
      },
      threshold: {
        type: Number,
        required: true
      },
      timeWindow: {
        type: Number,
        required: true,
        default: 5 // 默认5分钟
      }
    },
    notification: {
      type: {
        type: String,
        enum: Object.values(AlertNotificationType),
        required: true
      },
      recipients: [String],
      webhookUrl: String
    },
    lastTriggered: {
      type: Date
    },
    triggerCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'alert_rules'
  }
);

export const AlertRule = mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
