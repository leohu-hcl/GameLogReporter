using System;
using System.Collections.Generic;

namespace GameLogReporter
{
    /// <summary>
    /// 日志类型
    /// </summary>
    public enum GameLogType
    {
        Performance,
        UserAction,
        SystemLog,
        Custom
    }

    /// <summary>
    /// 日志级别
    /// </summary>
    public enum LogLevel
    {
        Debug,
        Info,
        Warning,
        Error,
        Critical
    }

    /// <summary>
    /// 日志数据模型
    /// </summary>
    [Serializable]
    public class LogData
    {
        public string sessionId;
        public GameLogType logType;
        public LogLevel level;
        public string message;
        public string stackTrace;
        public Dictionary<string, object> metadata;
        public string[] tags;
        public DateTime timestamp;
        public string clientVersion;
        // 注意：deviceInfo 不再在此处发送，已存储在服务器端的设备表中
    }

    /// <summary>
    /// 设备信息
    /// </summary>
    [Serializable]
    public class DeviceInfo
    {
        public string platform;
        public string deviceModel;
        public string osVersion;
        public string unityVersion;
    }

    /// <summary>
    /// 会话创建请求
    /// </summary>
    [Serializable]
    public class CreateSessionRequest
    {
        public string deviceId;
        public DeviceInfo deviceInfo;
    }

    /// <summary>
    /// 日志传输对象（用于序列化）
    /// </summary>
    [Serializable]
    public class LogTransmission
    {
        public string sessionId;
        public GameLogType logType;
        public LogLevel level;
        public string message;
        public string stackTrace;
        public Dictionary<string, object> metadata;
        public string[] tags;
        public DateTime timestamp;
        public string clientVersion;
    }

    /// <summary>
    /// 批量日志上报请求
    /// </summary>
    [Serializable]
    public class BatchLogsRequest
    {
        public LogTransmission[] logs;
    }
}
