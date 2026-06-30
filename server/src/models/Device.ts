import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  platform?: string;
  deviceModel?: string;
  osVersion?: string;
  unityVersion?: string;
  firstSeen: Date;
  lastSeen: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    platform: {
      type: String,
      index: true
    },
    deviceModel: {
      type: String,
      index: true
    },
    osVersion: {
      type: String
    },
    unityVersion: {
      type: String
    },
    firstSeen: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    lastSeen: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'devices'
  }
);

// deviceId 已是 unique 索引；lastSeen 单列索引支撑「活跃 = lastSeen 在阈值内」的派生查询

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);