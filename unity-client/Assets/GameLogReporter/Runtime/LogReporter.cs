using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
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
        // 主线程独占：去重/限长/批量都只在主线程访问此队列
        private Queue<LogData> _logQueue = new Queue<LogData>();
        // 线程安全入口：ReportLog 可能在后台线程被调用（Application.logMessageReceived），
        // 先入此并发队列，主线程 Update 的 DrainIncoming 再搬到 _logQueue。
        // ponytail: 单消费者（主线程）假设——只有 DrainIncoming 出队，勿在他处消费
        private readonly ConcurrentQueue<LogData> _incomingQueue = new ConcurrentQueue<LogData>();
        private float _lastBatchTime;
        // 下次心跳的绝对时刻（Time.time 基准）。发完即重设，切后台 Time.time 暂停，
        // 回前台最多触发一次后立刻重设，天然避免「积压补发」连续多条心跳。
        private float _nextHeartbeatTime;
        private bool _isInitialized = false;

        // 最大缓存限制
        private const int MAX_LOG_QUEUE_SIZE = 1000;

        // 去重服务
        private DeduplicationService _deduplicationService;

        // SDK日志管理器
        private SdkLogger _sdkLogger;

        // 会话管理器
        private SessionManager _sessionManager;

        // 离线日志持久化
        private LogStore _logStore;

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

            // 离线持久化层（按开关启用）
            if (_config.enableOfflinePersistence)
            {
                _logStore = new LogStore(_sdkLogger);
            }

            _networkManager = new NetworkManager($"{_config.apiBaseUrl}/logs", _sdkLogger, _logStore);
            _logCollector = new LogCollector(this);
            _logCollector.Initialize();

            // 初始化去重服务
            if (_config.enableDeduplication)
            {
                _deduplicationService = new DeduplicationService(_config.deduplicationWindow, _sdkLogger);
            }

            // 初始化会话管理器
            _sessionManager = new SessionManager($"{_config.apiBaseUrl}/sessions", _sdkLogger);

            // 初始化时向服务器请求会话ID
            StartCoroutine(RequestSessionId());

            // 读取上次未发出的日志，补发（退出/网络失败/崩溃时落盘的）
            if (_logStore != null)
            {
                var pending = _logStore.Load();
                if (pending.Count > 0)
                {
                    foreach (var logData in pending)
                    {
                        _logQueue.Enqueue(logData);
                    }
                    _logStore.Clear(); // 取走即清盘；若本次又没发成功，退出时会重新落盘
                    _sdkLogger.Info($"Recovered {pending.Count} pending logs from disk");
                }
            }

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

            // 先把后台线程投递的日志搬进主线程队列（去重/限长在此发生）
            DrainIncoming();

            // 清理过期的去重缓存，带计数的过期日志入队上报
            if (_config.enableDeduplication)
            {
                CleanupDeduplicationCache();
            }

            // 批量上报：定时到点 或 队列达到批量大小（合并为一次判断，避免同帧多次 flush）
            bool dueByTime = Time.time - _lastBatchTime >= _config.batchInterval;
            bool dueBySize = _logQueue.Count >= _config.batchSize;
            if (dueByTime || dueBySize)
            {
                FlushLogs();
                _lastBatchTime = Time.time;
            }

            // 定时心跳：刷新服务端 lastSeen，保持活跃状态在线。
            // Time.time 切后台时暂停，故回前台不会积压补发多条。
            if (Time.time >= _nextHeartbeatTime)
            {
                StartCoroutine(_sessionManager.Heartbeat());
                _nextHeartbeatTime = Time.time + _config.heartbeatInterval;
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
            // 0. 先 drain 入口队列，确保后台线程残留日志也纳入
            DrainIncoming();

            // 1. 去重缓存中带重复计数的日志入队
            if (_config.enableDeduplication && _deduplicationService != null)
            {
                var deduplicatedLogs = _deduplicationService.GetDeduplicatedLogs();
                foreach (var logData in deduplicatedLogs)
                {
                    EnqueueToLogQueue(logData);
                }
            }

            // 2. 汇总所有未发日志（内存队列 + 离线队列）落盘，交给下次启动补发。
            //    退出时的异步 HTTP 基本发不完，落盘是唯一可靠的做法。
            if (_logStore != null)
            {
                var unsent = new List<LogData>(_logQueue);
                if (_networkManager != null)
                {
                    unsent.AddRange(_networkManager.DrainOfflineQueue());
                }
                _logStore.Save(unsent);
            }
            else
            {
                // 未启用持久化：尽力异步发一次（不保证送达）
                FlushLogs();
            }

            // 3. 结束会话（发送请求即可，不强求送达；服务端有超时清理）
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
        /// 上报单条日志。可在任意线程调用（Unity 后台线程日志会经此进入）——
        /// 仅做线程安全的入队，去重/限长/批量统一由主线程的 DrainIncoming 处理。
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

            // 唯一动作：入并发队列（任意线程安全）。不触碰 Time.time / _logQueue。
            _incomingQueue.Enqueue(logData);
        }

        /// <summary>
        /// 主线程消费入口队列：去重 + 限长 + 入 _logQueue。
        /// 仅由主线程（Update / OnApplicationQuit）调用。
        /// </summary>
        private void DrainIncoming()
        {
            while (_incomingQueue.TryDequeue(out var logData))
            {
                // 去重检查（DeduplicationService 用 Time.time，主线程安全）
                if (_config.enableDeduplication && ShouldDeduplicate(logData))
                {
                    continue;
                }

                EnqueueToLogQueue(logData);
            }
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
        /// 清理过期的去重缓存，并把带重复计数的过期日志入队上报。
        /// </summary>
        private void CleanupDeduplicationCache()
        {
            if (_deduplicationService == null) return;

            var toReport = _deduplicationService.CleanupDeduplicationCache();
            foreach (var logData in toReport)
            {
                EnqueueToLogQueue(logData);
            }
        }

        /// <summary>
        /// 入主线程日志队列（带最大长度限制）。仅主线程调用。
        /// </summary>
        private void EnqueueToLogQueue(LogData logData)
        {
            if (_logQueue.Count >= MAX_LOG_QUEUE_SIZE)
            {
                _sdkLogger?.Warning($"Log queue reached maximum size ({MAX_LOG_QUEUE_SIZE}), dropping oldest log");
                _logQueue.Dequeue();
            }
            _logQueue.Enqueue(logData);
        }

        /// <summary>
        /// 批量上报日志。
        /// </summary>
        /// <param name="sync">已废弃：Unity 无法真正同步上报，退出可靠性改由离线持久化保证。此参数被忽略。</param>
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
                _networkManager.SendLogsBatch(logs);
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
