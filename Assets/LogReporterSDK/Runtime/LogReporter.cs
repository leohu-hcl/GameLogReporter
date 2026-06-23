using System;
using System.Collections.Generic;
using UnityEngine;
using System.Collections;

namespace GameLogReporter
{
    /// <summary>
    /// 日志上报器 - 单例模式，统一日志上报入口。
    /// 通过 [RuntimeInitializeOnLoadMethod] 自启动，无需挂载到场景。
    /// </summary>
    public class LogReporter : MonoBehaviour
    {
        private static LogReporter _instance;
        private static readonly object _lock = new object();

        // 代码侧覆盖配置（Configure 在 Bootstrap 前调用时暂存于此，优先级最高）
        private static LogReporterConfig _overrideConfig;

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

        /// <summary>
        /// 自启动入口 - 进入运行时在首个场景加载前自动创建 LogReporter。
        /// </summary>
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Bootstrap()
        {
            if (_instance != null) return;

            GameObject go = new GameObject("LogReporter");
            _instance = go.AddComponent<LogReporter>();
            DontDestroyOnLoad(go);
            // Awake 已在 AddComponent 时执行并完成 Initialize
        }

        /// <summary>
        /// 解析生效配置：代码覆盖 > Resources 资源 > 内置默认值。
        /// </summary>
        private static LogReporterConfig ResolveConfig()
        {
            if (_overrideConfig != null)
            {
                return _overrideConfig;
            }

            var fromResources = Resources.Load<LogReporterConfig>(LogReporterConfig.ResourceName);
            if (fromResources != null)
            {
                // 克隆一份，避免运行时改动写回 Resources 资源
                return fromResources.Clone();
            }

            return ScriptableObject.CreateInstance<LogReporterConfig>();
        }

        /// <summary>
        /// 代码侧配置。可在自启动前（如自定义 [RuntimeInitializeOnLoadMethod(SubsystemRegistration)]）
        /// 调用以设置 API 地址等；自启动后调用仅热更非网络字段。
        /// </summary>
        public static void Configure(Action<LogReporterConfig> mutate)
        {
            if (mutate == null) return;

            if (_instance == null)
            {
                // 尚未自启动：基于默认/Resources 克隆出覆盖配置，Bootstrap 时采用
                if (_overrideConfig == null)
                {
                    _overrideConfig = ResolveConfig();
                }
                mutate(_overrideConfig);
            }
            else
            {
                // 已自启动：对实例配置应用变更并热更可热更字段
                _instance.ApplyConfigChange(mutate);
            }
        }

        private LogReporterConfig _config;

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
            // 解析配置（代码覆盖 > Resources > 默认值）
            _config = ResolveConfig();

            // 初始化SDK日志管理器
            _sdkLogger = new SdkLogger(_config.enableSdkLogging);

            _networkManager = new NetworkManager($"{_config.apiBaseUrl}/logs", _sdkLogger);
            _logCollector = new LogCollector(this);
            _logCollector.Initialize(_config.enablePerformanceMonitoring, _config.enableUserActionTracking, _config.performanceCheckInterval);

            // 初始化去重服务
            if (_config.enableDeduplication)
            {
                _deduplicationService = new DeduplicationService(_config.deduplicationWindow, _sdkLogger);
            }

            // 初始化会话管理器
            _sessionManager = new SessionManager($"{_config.apiBaseUrl}/sessions", _sdkLogger);

            // 初始化时向服务器请求会话ID
            StartCoroutine(RequestSessionId());

            _isInitialized = true;

            _sdkLogger.Info("LogReporter initialized");
        }

        /// <summary>
        /// 运行时应用配置变更 - 仅热更非网络字段；网络字段（apiBaseUrl）变更需在自启动前 Configure。
        /// </summary>
        private void ApplyConfigChange(Action<LogReporterConfig> mutate)
        {
            string prevUrl = _config.apiBaseUrl;
            mutate(_config);

            if (_config.apiBaseUrl != prevUrl)
            {
                _config.apiBaseUrl = prevUrl; // 回滚，避免与已建的 Network/Session 管理器不一致
                _sdkLogger?.Warning("apiBaseUrl 变更需在自启动前调用 Configure，运行时修改已忽略", "LogReporter");
            }

            // 热更 SDK 日志开关
            _sdkLogger?.UpdateConfig(_config.enableSdkLogging);
        }


        private void Update()
        {
            if (!_isInitialized) return;

            // 清理过期的去重缓存
            if (_config.enableDeduplication)
            {
                CleanupDeduplicationCache();
            }

            // 定时批量上报
            if (Time.time - _lastBatchTime >= _config.batchInterval)
            {
                FlushLogs();
                _lastBatchTime = Time.time;
            }

            // 如果队列达到批量大小，立即上报
            if (_logQueue.Count >= _config.batchSize)
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
            if (_config.enableDeduplication && _deduplicationService != null)
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
                logData.clientVersion = _config.clientVersion;
            }
            logData.timestamp = DateTime.UtcNow;

            if (string.IsNullOrEmpty(logData.sessionId))
            {
                logData.sessionId = _logCollector?.GetSessionId();
            }

            // 去重检查
            if (_config.enableDeduplication && ShouldDeduplicate(logData))
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
            while (_logQueue.Count > 0 && logs.Count < _config.batchSize)
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
