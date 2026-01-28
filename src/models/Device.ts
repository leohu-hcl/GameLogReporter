import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  platform?: string;
  deviceModel?: string;
  osVersion?: string;
  unityVersion?: string;
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
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
      default: () => new Date()
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'devices'
  }
);

// 创建复合索引以提高查询性能
DeviceSchema.index({ deviceId: 1, isActive: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);