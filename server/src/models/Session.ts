import mongoose, { Schema, Document } from 'mongoose';
import { Device } from './Device';

export interface ISession extends Document {
  sessionId: string;
  deviceId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'ended';
  gameId?: string;
  userId?: string;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      ref: 'Device',
      index: true
    },
    startTime: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    endTime: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      required: true,
      default: 'active',
      index: true
    },
    gameId: {
      type: String,
      index: true
    },
    userId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'sessions'
  }
);

// 创建复合索引以提高查询性能
SessionSchema.index({ deviceId: 1, startTime: -1 });
SessionSchema.index({ status: 1, startTime: -1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);