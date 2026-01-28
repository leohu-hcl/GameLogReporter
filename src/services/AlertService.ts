import { AlertRule, IAlertRule, AlertCondition } from '../models/AlertRule';
import { AlertHistory, IAlertHistory } from '../models/AlertHistory';
import { Log, LogType, LogLevel } from '../models/Log';
import { setupLogger } from '../config/logger';
import { broadcastStatsUpdate } from './WebSocketService';
import * as statsService from './StatsService';

const logger = setupLogger();

export interface CreateAlertRuleDto {
  name: string;
  description?: string;
  sessionId?: string;
  enabled: boolean;
  condition: {
    logType?: string;
    level?: string;
    field: string;
    operator: AlertCondition;
    threshold: number;
    timeWindow: number;
  };
  notification: {
    type: string;
    recipients?: string[];
    webhookUrl?: string;
  };
}

export interface GetAlertHistoryQuery {
  page: number;
  limit: number;
  startTime?: string;
  endTime?: string;
}

export async function getAlertRules(): Promise<IAlertRule[]> {
  try {
    return await AlertRule.find({ enabled: true }).sort({ createdAt: -1 }).lean();
  } catch (error) {
    logger.error('Error getting alert rules:', error);
    throw error;
  }
}

export async function createAlertRule(data: CreateAlertRuleDto): Promise<IAlertRule> {
  try {
    const rule = new AlertRule(data);
    await rule.save();
    return rule;
  } catch (error) {
    logger.error('Error creating alert rule:', error);
    throw error;
  }
}

export async function getAlertRuleById(id: string): Promise<IAlertRule | null> {
  try {
    return await AlertRule.findById(id).lean();
  } catch (error) {
    logger.error('Error getting alert rule by id:', error);
    throw error;
  }
}

export async function updateAlertRule(id: string, data: Partial<CreateAlertRuleDto>): Promise<IAlertRule | null> {
  try {
    return await AlertRule.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  } catch (error) {
    logger.error('Error updating alert rule:', error);
    throw error;
  }
}

export async function deleteAlertRule(id: string): Promise<void> {
  try {
    await AlertRule.findByIdAndDelete(id);
  } catch (error) {
    logger.error('Error deleting alert rule:', error);
    throw error;
  }
}

export async function getAlertHistory(query: GetAlertHistoryQuery): Promise<{
  alerts: IAlertHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const { page, limit, startTime, endTime } = query;

    const filter: any = {};
    if (startTime || endTime) {
      filter.triggeredAt = {};
      if (startTime) filter.triggeredAt.$gte = new Date(startTime);
      if (endTime) filter.triggeredAt.$lte = new Date(endTime);
    }

    const total = await AlertHistory.countDocuments(filter);
    const alerts = await AlertHistory.find(filter)
      .sort({ triggeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      alerts: alerts as IAlertHistory[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Error getting alert history:', error);
    throw error;
  }
}

// 检查告警规则并触发告警
export async function checkAlertRules(): Promise<void> {
  try {
    const rules = await AlertRule.find({ enabled: true });

    for (const rule of rules) {
      await checkSingleAlertRule(rule);
    }
  } catch (error) {
    logger.error('Error checking alert rules:', error);
  }
}

async function checkSingleAlertRule(rule: IAlertRule): Promise<void> {
  try {
    const { condition } = rule;
    const timeWindow = condition.timeWindow * 60 * 1000; // 转换为毫秒
    const startTime = new Date(Date.now() - timeWindow);

    // 构建查询条件
    const filter: any = {
      timestamp: { $gte: startTime }
    };

    if (condition.logType) {
      filter.logType = condition.logType;
    }

    if (condition.level) {
      filter.level = condition.level;
    }

    if (rule.sessionId) {
      filter.sessionId = rule.sessionId;
    }

    // 根据字段和操作符进行聚合查询
    let count = 0;

    if (condition.field === 'count') {
      // 统计日志数量
      count = await Log.countDocuments(filter);
    } else if (condition.field === 'errorRate') {
      // 计算错误率
      const total = await Log.countDocuments({ ...filter, logType: { $ne: LogType.ERROR } });
      const errors = await Log.countDocuments({ ...filter, logType: LogType.ERROR });
      count = total > 0 ? (errors / total) * 100 : 0;
    }

    // 检查是否满足告警条件
    let shouldTrigger = false;

    switch (condition.operator) {
      case AlertCondition.GREATER_THAN:
        shouldTrigger = count > condition.threshold;
        break;
      case AlertCondition.LESS_THAN:
        shouldTrigger = count < condition.threshold;
        break;
      case AlertCondition.EQUAL:
        shouldTrigger = count === condition.threshold;
        break;
      case AlertCondition.NOT_EQUAL:
        shouldTrigger = count !== condition.threshold;
        break;
    }

    if (shouldTrigger) {
      await triggerAlert(rule, count);
    }
  } catch (error) {
    logger.error(`Error checking alert rule ${rule._id}:`, error);
  }
}

async function triggerAlert(rule: IAlertRule, value: number): Promise<void> {
  try {
    // 创建告警历史记录
    const alertHistory = new AlertHistory({
      alertRuleId: rule._id.toString(),
      alertRuleName: rule.name,
      sessionId: rule.sessionId,
      message: `Alert triggered: ${rule.name}. Current value: ${value}, Threshold: ${rule.condition.threshold}`,

      severity: rule.condition.level || 'warning',
      triggeredAt: new Date(),
      metadata: {
        value,
        threshold: rule.condition.threshold,
        operator: rule.condition.operator
      }
    });

    await alertHistory.save();

    // 更新告警规则
    await AlertRule.findByIdAndUpdate(rule._id, {
      lastTriggered: new Date(),
      $inc: { triggerCount: 1 }
    });

    // 发送通知
    await sendNotification(rule, alertHistory);

    // 广播告警更新
    broadcastStatsUpdate({ type: 'alert', data: alertHistory });

    logger.warn(`Alert triggered: ${rule.name}`, { ruleId: rule._id, value });
  } catch (error) {
    logger.error('Error triggering alert:', error);
  }
}

async function sendNotification(rule: IAlertRule, alertHistory: IAlertHistory): Promise<void> {
  try {
    const { notification } = rule;

    switch (notification.type) {
      case 'email':
        // TODO: 实现邮件发送
        logger.info('Email notification would be sent', {
          recipients: notification.recipients,
          alert: alertHistory.message
        });
        break;

      case 'webhook':
        // TODO: 实现Webhook调用
        logger.info('Webhook notification would be sent', {
          url: notification.webhookUrl,
          alert: alertHistory.message
        });
        break;

      case 'in_app':
        // 已经在triggerAlert中通过WebSocket广播
        break;
    }
  } catch (error) {
    logger.error('Error sending notification:', error);
  }
}

// 启动定时检查任务
export function startAlertMonitoring(intervalMinutes: number = 5): void {
  logger.info(`Starting alert monitoring with ${intervalMinutes} minute interval`);
  
  // 立即执行一次
  checkAlertRules();

  // 定时执行
  setInterval(() => {
    checkAlertRules();
  }, intervalMinutes * 60 * 1000);
}
