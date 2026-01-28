using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// 日志收集器 - 自动收集Unity日志、性能数据、用户行为
    /// </summary>
    public class LogCollector
    {
        private LogReporter _reporter;
        private bool _enablePerformanceMonitoring;
        private bool _enableUserActionTracking;
        private float _performanceCheckInterval;
        private float _lastPerformanceCheck;
        private string _sessionId;

        public LogCollector(LogReporter reporter)
        {
            _reporter = reporter;
        }

        public void Initialize(bool enablePerformanceMonitoring, bool enableUserActionTracking, float performanceCheckInterval)
        {
            _enablePerformanceMonitoring = enablePerformanceMonitoring;
            _enableUserActionTracking = enableUserActionTracking;
            _performanceCheckInterval = performanceCheckInterval;

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
            // 过滤SDK自身的日志，避免重复上报
            if (SdkLogger.IsSdkLog(condition))
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
            
            // userId 不再在日志数据中直接设置，已存储在会话表中
            
            _reporter.ReportLog(logData);
        }

        public void Update()
        {
            if (_enablePerformanceMonitoring && Time.time - _lastPerformanceCheck >= _performanceCheckInterval)
            {
                CollectPerformanceData();
                _lastPerformanceCheck = Time.time;
            }
        }

        private void CollectPerformanceData()
        {
            float fps = 1f / Time.deltaTime;
            float memoryMB = GC.GetTotalMemory(false) / (1024f * 1024f);

            _reporter.ReportPerformance(fps, memoryMB);
        }

        public void TrackUserAction(string action, Dictionary<string, object> metadata = null)
        {
            if (_enableUserActionTracking)
            {
                _reporter.ReportUserAction(action, metadata);
            }
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
