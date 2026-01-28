import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertHistory extends Document {
  alertRuleId: string;
  alertRuleName: string;
  sessionId?: string;
  message: string;
  severity: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

const AlertHistorySchema = new Schema<IAlertHistory>(
  {
    alertRuleId: {
      type: Schema.Types.ObjectId,
      ref: 'AlertRule',
      required: true,
      index: true
    },
    alertRuleName: {
      type: String,
      required: true
    },
    sessionId: {
      type: String,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      required: true
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    resolvedAt: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'alert_history'
  }
);

AlertHistorySchema.index({ alertRuleId: 1, triggeredAt: -1 });
AlertHistorySchema.index({ sessionId: 1, triggeredAt: -1 });

export const AlertHistory = mongoose.model<IAlertHistory>('AlertHistory', AlertHistorySchema);
