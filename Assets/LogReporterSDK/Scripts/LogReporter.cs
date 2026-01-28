using System;
using System.Collections.Generic;
using UnityEngine;
using System.Collections;

namespace GameLogReporter
{
    /// <summary>
    /// 日志上报器 - 单例模式，统一日志上报入口
    /// </summary>
    public class LogReporter : MonoBehaviour
    {
        private static LogReporter _instance;
        private static readonly object _lock = new object();

        public static LogReporter Instance
        {
            get
            {
                if (_instance == null)
                {
                    lock (_lock)
                    {
                        if (_instance == null)
                        {
                            GameObject go = new GameObject("LogReporter");
                            _instance = go.AddComponent<LogReporter>();
                            DontDestroyOnLoad(go);
                        }
                    }
                }
                return _instance;
            }
        }

        [Header("Configuration")]
        [SerializeField] private string apiBaseUrl = "http://localhost:3000/api";
        [SerializeField] private string clientVersion = "1.0.0";
        [SerializeField] private float batchInterval = 5f; // 批量上报间隔（秒）
        [SerializeField] private int batchSize = 50; // 批量上报大小
        [SerializeField] private bool enablePerformanceMonitoring = true;
        [SerializeField] private bool enableUserActionTracking = true;
        [SerializeField] private float performanceCheckInterval = 1f; // 性能检查间隔（秒）

        [Header("Deduplication")]
        [SerializeField] private bool enableDeduplication = true; // 启用日志去重
        [SerializeField] private float deduplicationWindow = 10f; // 去重时间窗口（秒）

        [Header("SDK Logging")]
        [SerializeField] private bool enableSdkLogging = true; // SDK自身是否打印日志（Debug.Log）

        private NetworkManager _networkManager;
        private LogCollector _logCollector;
        private Queue<LogData> _logQueue = new Queue<LogData>();
        private float _lastBatchTime;
        private bool _isInitialized = false;

        // 最大缓存限制
        private const int MAX_LOG_QUEUE_SIZE = 1000;

        // 去重服务
        private DeduplicationService _deduplicationService;

        // SDK日志管理器
        private SdkLogger _sdkLogger;

        // 会话管理器
        private SessionManager _sessionManager;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(gameObject);
            Initialize();
        }

        private void Initialize()
        {
            // 初始化SDK日志管理器
            _sdkLogger = new SdkLogger(enableSdkLogging);

            _networkManager = new NetworkManager($"{apiBaseUrl}/logs", _sdkLogger);
            _logCollector = new LogCollector(this);
            _logCollector.Initialize(enablePerformanceMonitoring, enableUserActionTracking, performanceCheckInterval);

            // 初始化去重服务
            if (enableDeduplication)
            {
                _deduplicationService = new DeduplicationService(deduplicationWindow, _sdkLogger);
            }

            // 初始化会话管理器
            _sessionManager = new SessionManager($"{apiBaseUrl}/sessions", _sdkLogger);

            // 初始化时向服务器请求会话ID
            StartCoroutine(RequestSessionId());

            _isInitialized = true;

            _sdkLogger.Info("LogReporter initialized");
        }

        private void Update()
        {
            if (!_isInitialized) return;

            // 清理过期的去重缓存
            if (enableDeduplication)
            {
                CleanupDeduplicationCache();
            }

            // 定时批量上报
            if (Time.time - _lastBatchTime >= batchInterval)
            {
                FlushLogs();
                _lastBatchTime = Time.time;
            }

            // 如果队列达到批量大小，立即上报
            if (_logQueue.Count >= batchSize)
            {
                FlushLogs();
            }

            // 尝试发送离线队列中的日志（带重试延迟）
            if (_networkManager != null && _networkManager.GetOfflineQueueSize() > 0)
            {
                float nextRetryTime = _networkManager.GetNextRetryTime();
                if (Time.time >= nextRetryTime)
                {
                    StartCoroutine(_networkManager.TrySendOfflineQueue());
                }
            }
        }

        private void OnApplicationQuit()
        {
            // 1. 上报所有去重缓存中的日志
            if (enableDeduplication && _deduplicationService != null)
            {
                var deduplicatedLogs = _deduplicationService.GetDeduplicatedLogs();
                foreach (var logData in deduplicatedLogs)
                {
                    _logQueue.Enqueue(logData);
                }
            }

            // 2. 上报剩余日志
            FlushLogs(true);

            // 3. 结束会话（发送请求即可，不需要等待）
            if (_sessionManager != null && _logCollector != null && !string.IsNullOrEmpty(_logCollector.GetSessionId()))
            {
                StartCoroutine(_sessionManager.EndSession(_logCollector.GetSessionId()));
            }
        }

        private void OnDestroy()
        {
            // 只清理资源，不做任何网络操作
            _logCollector?.Dispose();
        }

        /// <summary>
        /// 上报单条日志
        /// </summary>
        public void ReportLog(LogData logData)
        {
            if (string.IsNullOrEmpty(logData.clientVersion))
            {
                logData.clientVersion = clientVersion;
            }
            logData.timestamp = DateTime.UtcNow;

            if (string.IsNullOrEmpty(logData.sessionId))
            {
                logData.sessionId = _logCollector?.GetSessionId();
            }

            // 去重检查
            if (enableDeduplication && ShouldDeduplicate(logData))
            {
                return;
            }

            // 检查日志队列是否超出最大限制
            if (_logQueue.Count >= MAX_LOG_QUEUE_SIZE)
            {
                _sdkLogger?.Warning($"Log queue reached maximum size ({MAX_LOG_QUEUE_SIZE}), dropping oldest log");
                _logQueue.Dequeue(); // 移除最旧的日志
            }

            _logQueue.Enqueue(logData);
        }

        /// <summary>
        /// 判断是否应该去重
        /// </summary>
        private bool ShouldDeduplicate(LogData logData)
        {
            if (_deduplicationService == null)
            {
                return false;
            }
            return _deduplicationService.ShouldDeduplicate(logData);
        }

        /// <summary>
        /// 清理过期的去重缓存
        /// </summary>
        private void CleanupDeduplicationCache()
        {
            if (_deduplicationService != null)
            {
                _deduplicationService.CleanupDeduplicationCache();
            }
        }

        /// <summary>
        /// 批量上报日志
        /// </summary>
        public void FlushLogs(bool sync = false)
        {
            if (_logQueue.Count == 0) return;

            List<LogData> logs = new List<LogData>();
            while (_logQueue.Count > 0 && logs.Count < batchSize)
            {
                logs.Add(_logQueue.Dequeue());
            }

            if (logs.Count > 0)
            {
                _sdkLogger?.Debug($"Flushing {logs.Count} logs to server");

                if (sync)
                {
                    _networkManager.SendLogsBatchSync(logs);
                }
                else
                {
                    _networkManager.SendLogsBatch(logs);
                }
            }
        }

        /// <summary>
        /// 上报性能日志
        /// </summary>
        public void ReportPerformance(float fps, float memoryMB, float loadTimeMs = 0)
        {
            ReportLog(new LogData
            {
                logType = GameLogType.Performance,
                level = LogLevel.Info,
                message = "Performance metrics",
                metadata = new Dictionary<string, object>
                {
                    { "fps", fps },
                    { "memoryMB", memoryMB },
                    { "loadTimeMs", loadTimeMs }
                }
            });
        }

        /// <summary>
        /// 上报用户行为日志
        /// </summary>
        public void ReportUserAction(string action, Dictionary<string, object> metadata = null)
        {
            ReportLog(new LogData
            {
                logType = GameLogType.UserAction,
                level = LogLevel.Info,
                message = $"User action: {action}",
                metadata = metadata ?? new Dictionary<string, object> { { "action", action } }
            });
        }

        /// <summary>
        /// 上报自定义日志
        /// </summary>
        public void ReportCustom(string message, LogLevel level = LogLevel.Info, Dictionary<string, object> metadata = null)
        {
            ReportLog(new LogData
            {
                logType = GameLogType.Custom,
                level = level,
                message = message,
                metadata = metadata
            });
        }

        /// <summary>
        /// 获取设备信息
        /// </summary>
        private DeviceInfo GetDeviceInfo()
        {
            return new DeviceInfo
            {
                platform = Application.platform.ToString(),
                deviceModel = SystemInfo.deviceModel,
                osVersion = SystemInfo.operatingSystem,
                unityVersion = Application.unityVersion
            };
        }

        /// <summary>
        /// 异步请求服务器分配的会话ID
        /// </summary>
        private IEnumerator RequestSessionId()
        {
            // 准备设备信息
            var deviceInfo = new DeviceInfo
            {
                platform = Application.platform.ToString(),
                deviceModel = SystemInfo.deviceModel,
                osVersion = SystemInfo.operatingSystem,
                unityVersion = Application.unityVersion
            };

            var coroutines = _sessionManager.CreateSession(
                deviceInfo,
                onSuccess: (sessionId) =>
                {
                    _logCollector?.SetSession(sessionId);
                    _sdkLogger?.Debug($"Session ID set: {sessionId}", "LogReporter");
                },
                onError: (error) =>
                {
                    _sdkLogger?.Error($"Failed to get session ID: {error}", "LogReporter");
                }
            );
            yield return StartCoroutine(coroutines);
        }
    }
}
