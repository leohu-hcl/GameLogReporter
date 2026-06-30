import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupLogger } from '../config/logger';
import { Session } from '../models/Session';

dotenv.config();

const logger = setupLogger();

/**
 * 一次性回填：清理历史悬挂的 active 会话。
 * 规则与 createSession 一致——同一设备只保留最新一个 active，其余置为 ended。
 * （新建会话已自动关闭旧 active，此脚本仅修复脚本上线前堆积的数据。）
 */
async function backfill() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelog-reporter';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // 每个设备的 active 会话按开始时间倒序，第一个保留，其余作废
    const deviceIds: string[] = await Session.distinct('deviceId', { status: 'active' });
    let endedTotal = 0;

    for (const deviceId of deviceIds) {
      const active = await Session.find({ deviceId, status: 'active' })
        .sort({ startTime: -1 })
        .select('sessionId');

      // 跳过最新一个，关闭其余
      const stale = active.slice(1).map((s) => s.sessionId);
      if (stale.length === 0) continue;

      const res = await Session.updateMany(
        { sessionId: { $in: stale } },
        { status: 'ended', endTime: new Date() }
      );
      endedTotal += res.modifiedCount ?? 0;
      logger.info(`[backfill] device ${deviceId}: ended ${stale.length} stale sessions`);
    }

    logger.info(`[backfill] done. ended ${endedTotal} stale sessions across ${deviceIds.length} devices`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('[backfill] failed:', error);
    process.exit(1);
  }
}

backfill();
