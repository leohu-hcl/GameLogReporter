/**
 * 告警相关类型定义
 */

export enum AlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface Alert {
  _id: string;
  name: string;
  status: AlertStatus;
  severity: AlertSeverity;
  message: string;
  remark?: string;
  gameId?: string;
  relatedLogs?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  _id: string;
  name: string;
  gameId?: string;
  condition: Record<string, any>;
  notification: {
    enabled: boolean;
    recipients?: string[];
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertFilters {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  severity?: AlertSeverity;
  gameId?: string;
  startTime?: string;
  endTime?: string;
}
