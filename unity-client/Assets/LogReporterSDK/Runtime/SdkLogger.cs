using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// SDK日志管理器 - 仅用于在Unity控制台打印SDK内部日志
    /// </summary>
    public class SdkLogger
    {
        // SDK日志统一前缀
        public static string SdkLogPrefix = "[LogReporter SDK]";

        // 重入标志（每线程独立）：SDK 自身打印日志时置位，
        // 供 LogCollector 的 logMessageReceived 回调据此跳过 SDK 自己的日志，避免自收集回环。
        // 比前缀匹配稳健——不依赖消息内容。
        [System.ThreadStatic]
        private static bool _isEmitting;

        /// <summary>SDK 当前线程是否正在打印自身日志。</summary>
        public static bool IsEmitting => _isEmitting;

        private bool _enableLogging;

        public SdkLogger(bool enableLogging)
        {
            _enableLogging = enableLogging;
        }

        /// <summary>
        /// 更新配置
        /// </summary>
        public void UpdateConfig(bool enableLogging)
        {
            _enableLogging = enableLogging;
        }

        /// <summary>
        /// 记录信息日志
        /// </summary>
        public void Info(string message, string source = "SDK")
        {
            Log(message, LogLevel.Info, source);
        }

        /// <summary>
        /// 记录警告日志
        /// </summary>
        public void Warning(string message, string source = "SDK")
        {
            Log(message, LogLevel.Warning, source);
        }

        /// <summary>
        /// 记录错误日志
        /// </summary>
        public void Error(string message, string source = "SDK")
        {
            Log(message, LogLevel.Error, source);
        }

        /// <summary>
        /// 记录调试日志
        /// </summary>
        public void Debug(string message, string source = "SDK")
        {
            Log(message, LogLevel.Debug, source);
        }

        /// <summary>
        /// 统一日志记录方法
        /// </summary>
        private void Log(string message, LogLevel level, string source)
        {
            // 统一使用SDK前缀，source作为组件标识
            string fullMessage = $"{SdkLogPrefix}[{source}] {message}";

            // 是否打印到Unity控制台
            if (_enableLogging)
            {
                PrintToConsole(fullMessage, level);
            }
        }

        /// <summary>
        /// 打印到Unity控制台
        /// </summary>
        private void PrintToConsole(string message, LogLevel level)
        {
            _isEmitting = true; // 标记：本次 Debug.* 触发的 logMessageReceived 应被跳过
            try
            {
                switch (level)
                {
                    case LogLevel.Error:
                    case LogLevel.Critical:
                        UnityEngine.Debug.LogError(message);
                        break;
                    case LogLevel.Warning:
                        UnityEngine.Debug.LogWarning(message);
                        break;
                    default:
                        UnityEngine.Debug.Log(message);
                        break;
                }
            }
            finally
            {
                _isEmitting = false;
            }
        }


        /// <summary>
        /// 检查消息是否是SDK日志（用于过滤）
        /// </summary>
        public static bool IsSdkLog(string message)
        {
            if (string.IsNullOrEmpty(message))
                return false;

            // 检查是否以SDK统一前缀开头
            // 格式: [LogReporter SDK][组件名] 消息
            return message.StartsWith(SdkLogPrefix);
        }
    }
}
