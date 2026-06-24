using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// 日志收集器 - 捕获 Unity 控制台日志（Debug.Log/Warning/Error/Exception）并转交上报。
    /// </summary>
    public class LogCollector
    {
        private LogReporter _reporter;
        private string _sessionId;

        public LogCollector(LogReporter reporter)
        {
            _reporter = reporter;
        }

        public void Initialize()
        {
            Application.logMessageReceived += OnUnityLogReceived;
        }

        public void SetSession(string sessionId)
        {
            if (!string.IsNullOrEmpty(sessionId))
            {
                _sessionId = sessionId;
            }
        }

        private void OnUnityLogReceived(string condition, string stackTrace, LogType unityLogType)
        {
            // 过滤SDK自身的日志，避免自收集回环：
            // 优先用重入标志（不依赖消息内容、稳健），前缀匹配作兜底。
            if (SdkLogger.IsEmitting || SdkLogger.IsSdkLog(condition))
            {
                return; // 跳过SDK日志
            }

            LogLevel level = LogLevel.Info;
            GameLogType type = GameLogType.SystemLog;

            switch (unityLogType)
            {
                case LogType.Error:
                case LogType.Exception:
                    level = LogLevel.Error;
                    break;
                case LogType.Warning:
                    level = LogLevel.Warning;
                    break;
                case LogType.Log:
                    level = LogLevel.Info;
                    break;
            }

            var logData = new LogData
            {
                logType = type,
                level = level,
                message = condition,
                stackTrace = stackTrace
            };

            // 仅在会话ID存在时才设置（从服务器获取）
            if (!string.IsNullOrEmpty(_sessionId))
            {
                logData.sessionId = _sessionId;
            }

            _reporter.ReportLog(logData);
        }

        /// <summary>
        /// 获取当前会话ID
        /// </summary>
        public string GetSessionId()
        {
            return _sessionId;
        }

        /// <summary>
        /// 清理资源
        /// </summary>
        public void Dispose()
        {
            Application.logMessageReceived -= OnUnityLogReceived;
        }
    }
}
