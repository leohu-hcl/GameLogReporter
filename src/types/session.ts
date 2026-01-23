/**
 * 会话相关类型定义
 */

export enum SessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

export interface Device {
  _id?: string;
  deviceId: string;
  platform: string;
  deviceModel: string;
  osVersion?: string;
  unityVersion?: string;
  firstSeen: string;
  lastSeen: string;
  isActive?: boolean;
}

export interface Session {
  _id?: string;
  sessionId: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  gameId?: string;
  userId?: string;
  logCount?: number;
  errorCount?: number;
  warningCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionWithLogs {
  session: Session;
  device: Device | null;
  logs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionsByDevice {
  sessions: (Session & { logCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionStats {
  total: number;
  active: number;
  ended: number;
}

export interface SessionFilters {
  page?: number;
  limit?: number;
  deviceId?: string;
  status?: SessionStatus;
  startDate?: string;
  endDate?: string;
}
