import { Device } from '../models/Device';
import { Session } from '../models/Session';
import { Log } from '../models/Log';
import { AppError } from '../middleware/errorHandler';

export class DeviceService {
  // 活跃阈值：lastSeen 距今在此窗口内即视为活跃。
  // 必须 > SDK 心跳间隔（30s），容忍丢 2 次心跳。
  // ponytail: 硬编码常量，单一消费点；真要运行时可调再提升为配置
  static readonly ACTIVE_THRESHOLD_MS = 90_000;

  /** 设备是否活跃：lastSeen 在阈值窗口内 */
  private static isDeviceActive(lastSeen: Date): boolean {
    return Date.now() - new Date(lastSeen).getTime() < this.ACTIVE_THRESHOLD_MS;
  }

  /** 活跃设备的 Mongo 查询条件：lastSeen >= now - 阈值 */
  private static activeQuery() {
    return { lastSeen: { $gte: new Date(Date.now() - this.ACTIVE_THRESHOLD_MS) } };
  }

  /**
   * 获取所有设备列表
   */
  static async getAllDevices(page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    let query: any = {};

    // 支持按平台、活跃状态筛选
    if (filters?.platform) {
      query.platform = filters.platform;
    }
    if (filters?.isActive !== undefined) {
      // 活跃状态由 lastSeen 派生，筛选转成时间范围查询
      const threshold = new Date(Date.now() - this.ACTIVE_THRESHOLD_MS);
      query.lastSeen = filters.isActive ? { $gte: threshold } : { $lt: threshold };
    }

    const devices = await Device.find(query)
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Device.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // 为每个设备计算会话数和日志数
    const enrichedDevices = await Promise.all(
      devices.map(async (device) => {
        const sessionCount = await Session.countDocuments({ deviceId: device.deviceId });
        const logCount = await Log.countDocuments({ sessionId: { $in: await this.getSessionIdsForDevice(device.deviceId) } });

        return {
          ...device.toObject(),
          isActive: this.isDeviceActive(device.lastSeen),
          sessionCount,
          logCount,
        };
      })
    );

    return {
      devices: enrichedDevices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取单个设备详情，包括其会话列表
   */
  static async getDeviceWithSessions(deviceId: string, page = 1, limit = 10) {
    const device = await Device.findOne({ deviceId });
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    // 获取该设备的所有会话（分页）
    const skip = (page - 1) * limit;
    const sessions = await Session.find({ deviceId })
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments({ deviceId });
    const totalPages = Math.ceil(total / limit);

    // 为每个会话计算日志数
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const logCount = await Log.countDocuments({ sessionId: session.sessionId });
        const errorCount = await Log.countDocuments({
          sessionId: session.sessionId,
          logType: 'error',
        });

        return {
          ...session.toObject(),
          logCount,
          errorCount,
        };
      })
    );

    return {
      device: { ...device.toObject(), isActive: this.isDeviceActive(device.lastSeen) },
      sessions: enrichedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取设备统计信息
   */
  static async getDeviceStats(deviceId: string) {
    const device = await Device.findOne({ deviceId });
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const sessionCount = await Session.countDocuments({ deviceId });
    const activeSessions = await Session.countDocuments({
      deviceId,
      status: 'active',
    });

    const sessionIds = await Session.distinct('sessionId', { deviceId });
    const logCount = await Log.countDocuments({
      sessionId: { $in: sessionIds },
    });

    const errorCount = await Log.countDocuments({
      sessionId: { $in: sessionIds },
      logType: 'error',
    });

    const warningCount = await Log.countDocuments({
      sessionId: { $in: sessionIds },
      logType: 'warning',
    });

    return {
      device: { ...device.toObject(), isActive: this.isDeviceActive(device.lastSeen) },
      stats: {
        sessionCount,
        activeSessions,
        logCount,
        errorCount,
        warningCount,
      },
    };
  }

  /**
   * 更新设备信息
   */
  static async updateDevice(deviceId: string, updateData: any) {
    const device = await Device.findOneAndUpdate({ deviceId }, updateData, { new: true });

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    return device;
  }

  /**
   * 删除设备及其所有会话和日志
   */
  static async deleteDevice(deviceId: string) {
    const device = await Device.findOne({ deviceId });
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    // 获取该设备的所有会话ID
    const sessions = await Session.find({ deviceId });
    const sessionIds = sessions.map((s) => s.sessionId);

    // 删除这些会话的所有日志
    await Log.deleteMany({ sessionId: { $in: sessionIds } });

    // 删除所有会话
    await Session.deleteMany({ deviceId });

    // 删除设备
    await Device.deleteOne({ deviceId });

    return { message: 'Device and all related data deleted' };
  }

  /**
   * 获取所有设备统计摘要
   */
  static async getDevicesSummary() {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments(this.activeQuery());
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ status: 'active' });
    const totalLogs = await Log.countDocuments();

    // 获取最活跃的5个设备
    const topDevices = await Device.find()
      .sort({ lastSeen: -1 })
      .limit(5);

    const topDevicesWithStats = await Promise.all(
      topDevices.map(async (device) => {
        const sessionCount = await Session.countDocuments({ deviceId: device.deviceId });
        return {
          ...device.toObject(),
          isActive: this.isDeviceActive(device.lastSeen),
          sessionCount,
        };
      })
    );

    return {
      totalDevices,
      activeDevices,
      totalSessions,
      activeSessions,
      totalLogs,
      topDevices: topDevicesWithStats,
    };
  }

  /**
   * 获取设备列表（用于下拉框）
   */
  static async getDeviceList() {
    const devices = await Device.find().sort({ lastSeen: -1 });

    return devices.map((device) => ({
      id: device.deviceId,
      label: `${device.deviceModel} (${device.platform})`,
      value: device.deviceId,
    }));
  }

  /**
   * 辅助方法：获取设备的所有会话ID
   */
  private static async getSessionIdsForDevice(deviceId: string): Promise<string[]> {
    const sessions = await Session.find({ deviceId });
    return sessions.map((s) => s.sessionId);
  }
}
