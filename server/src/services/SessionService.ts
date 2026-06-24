import { Session } from '../models/Session';
import { Log } from '../models/Log';
import { Device } from '../models/Device';
import { ISession } from '../models/Session';
import { AppError } from '../middleware/errorHandler';

export class SessionService {
  /**
   * 获取单个会话详情，包含该会话的所有日志
   */
  static async getSessionWithLogs(sessionId: string, page = 1, limit = 20) {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // 获取会话关联的设备信息
    const device = await Device.findOne({ deviceId: session.deviceId });

    // 获取该会话的所有日志（分页）
    const skip = (page - 1) * limit;
    const logs = await Log.find({ sessionId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 获取日志总数
    const total = await Log.countDocuments({ sessionId });
    const totalPages = Math.ceil(total / limit);

    return {
      session,
      device,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取设备的所有会话列表
   */
  static async getSessionsByDevice(deviceId: string, page = 1, limit = 10) {
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
        return {
          ...session.toObject(),
          logCount,
        };
      })
    );

    return {
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
   * 更新会话（例如结束会话）
   */
  static async updateSession(sessionId: string, updateData: Partial<ISession>) {
    const session = await Session.findOneAndUpdate(
      { sessionId },
      updateData,
      { new: true }
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    return session;
  }

  /**
   * 结束会话
   */
  static async endSession(sessionId: string) {
    const session = await Session.findOneAndUpdate(
      { sessionId },
      {
        status: 'ended',
        endTime: new Date(),
      },
      { new: true }
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    return session;
  }

  /**
   * 自动关闭超时的活跃会话（无日志活动）
   */
  static async closeInactiveSessions(hoursInactive: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursInactive);

    // 获取所有active状态的会话
    const activeSessions = await Session.find({ status: 'active' });
    let closedCount = 0;

    for (const session of activeSessions) {
      // 检查该会话的最新日志时间
      const latestLog = await Log.findOne({ sessionId: session.sessionId })
        .sort({ createdAt: -1 })
        .select('createdAt');
      
      // 如果没有日志或最后日志时间早于截止时间，则关闭会话
      if (!latestLog || new Date(latestLog.createdAt) < cutoffTime) {
        await this.endSession(session.sessionId);
        closedCount++;
        console.log(`[SessionService] Auto-closed inactive session: ${session.sessionId}`);
      }
    }

    console.log(`[SessionService] Closed ${closedCount} inactive sessions`);
    return { closedCount };
  }

  /**
   * 删除会话及其所有日志
   */
  static async deleteSession(sessionId: string) {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // 删除会话的所有日志
    await Log.deleteMany({ sessionId });

    // 删除会话记录
    await Session.deleteOne({ sessionId });

    return { message: 'Session and all related logs deleted' };
  }

  /**
   * 获取会话统计信息
   */
  static async getSessionStats(deviceId?: string) {
    let query: any = {};
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const totalSessions = await Session.countDocuments(query);
    const activeSessions = await Session.countDocuments({
      ...query,
      status: 'active',
    });
    const endedSessions = await Session.countDocuments({
      ...query,
      status: 'ended',
    });

    return {
      total: totalSessions,
      active: activeSessions,
      ended: endedSessions,
    };
  }

  /**
   * 获取设备最近的会话
   */
  static async getRecentSessionsForDevice(deviceId: string, limit = 5) {
    const sessions = await Session.find({ deviceId })
      .sort({ startTime: -1 })
      .limit(limit);

    // 为每个会话计算日志数和错误/警告数
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const logCount = await Log.countDocuments({ sessionId: session.sessionId });
        const errorCount = await Log.countDocuments({
          sessionId: session.sessionId,
          logType: 'ERROR',
        });
        const warningCount = await Log.countDocuments({
          sessionId: session.sessionId,
          logType: 'WARNING',
        });

        return {
          ...session.toObject(),
          logCount,
          errorCount,
          warningCount,
        };
      })
    );

    return enrichedSessions;
  }
}
