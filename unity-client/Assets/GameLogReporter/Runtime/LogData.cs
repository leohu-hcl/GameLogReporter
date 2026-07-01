using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace GameLogReporter
{
    /// <summary>
    /// 日志类型
    /// </summary>
    public enum GameLogType
    {
        [EnumMember(Value = "performance")]
        Performance,
        [EnumMember(Value = "user_action")]
        UserAction,
        [EnumMember(Value = "system_log")]
        SystemLog,
        [EnumMember(Value = "custom")]
        Custom
    }

    /// <summary>
    /// 日志级别
    /// </summary>
    public enum LogLevel
    {
        [EnumMember(Value = "debug")]
        Debug,
        [EnumMember(Value = "info")]
        Info,
        [EnumMember(Value = "warning")]
        Warning,
        [EnumMember(Value = "error")]
        Error,
        [EnumMember(Value = "critical")]
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
        // 设备信息与客户端版本由服务端按会话存储，不随每条日志发送
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
