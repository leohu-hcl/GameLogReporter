using System;
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// 网络管理器 - 处理HTTP请求和WebSocket连接
    /// </summary>
    public class NetworkManager
    {
        private string _apiUrl;
        private Queue<LogData> _offlineQueue = new Queue<LogData>();
        private const int MAX_OFFLINE_QUEUE_SIZE = 1000;
        
        // HTTP客户端
        private HttpClient _httpClient;
        
        // 重试机制
        private float _lastRetryTime = 0f;
        private float _retryDelay = 5f; // 初始重试延迟（秒）
        private const float MAX_RETRY_DELAY = 60f; // 最大重试延迟（秒）
        private const float RETRY_DELAY_MULTIPLIER = 2f; // 延迟倍数（指数退避）
        private bool _isRetrying = false;
        
        // SDK日志管理器
        private SdkLogger _sdkLogger;

        public NetworkManager(string apiUrl, SdkLogger sdkLogger = null)
        {
            _apiUrl = apiUrl;
            _sdkLogger = sdkLogger;
            _httpClient = new HttpClient(10, sdkLogger);
        }

        /// <summary>
        /// 异步批量上报日志
        /// </summary>
        public void SendLogsBatch(List<LogData> logs)
        {
            if (logs == null || logs.Count == 0) return;

            MonoBehaviour coroutineRunner = LogReporter.Instance;
            coroutineRunner.StartCoroutine(SendLogsBatchCoroutine(logs));
        }

        /// <summary>
        /// 同步批量上报日志（用于应用退出时）
        /// </summary>
        public void SendLogsBatchSync(List<LogData> logs)
        {
            if (logs == null || logs.Count == 0) return;

            // 在Unity中，同步HTTP请求需要特殊处理
            // 这里使用协程但等待完成
            MonoBehaviour coroutineRunner = LogReporter.Instance;
            coroutineRunner.StartCoroutine(SendLogsBatchCoroutine(logs, true));
        }

        private IEnumerator SendLogsBatchCoroutine(List<LogData> logs, bool sync = false)
        {
            string json = SerializeLogs(logs);

            yield return _httpClient.Post(
                $"{_apiUrl}/batch",
                json,
                (responseText) =>
                {
                    _sdkLogger?.Debug($"Successfully sent {logs.Count} logs", "NetworkManager");
                    // 成功时重置重试延迟
                    _retryDelay = 5f;
                    _lastRetryTime = 0f;
                },
                (error) =>
                {
                    // 根据错误类型调整重试延迟
                    float multiplier = error.errorType == HttpErrorType.ConnectionError 
                        ? RETRY_DELAY_MULTIPLIER * 1.5f 
                        : RETRY_DELAY_MULTIPLIER;
                    _retryDelay = Mathf.Min(_retryDelay * multiplier, MAX_RETRY_DELAY);
                    
                    _sdkLogger?.Error($"Failed to send logs. {error.message}", "NetworkManager");
                    
                    // 失败时加入离线队列
                    foreach (var log in logs)
                    {
                        if (_offlineQueue.Count < MAX_OFFLINE_QUEUE_SIZE)
                        {
                            _offlineQueue.Enqueue(log);
                        }
                        else
                        {
                            _sdkLogger?.Warning($"Offline queue is full, dropping log: {log.message}", "NetworkManager");
                        }
                    }
                    
                    // 更新重试时间
                    _lastRetryTime = Time.time;
                }
            );
        }

        /// <summary>
        /// 尝试发送离线队列中的日志（带重试延迟和限制）
        /// </summary>
        public IEnumerator TrySendOfflineQueue()
        {
            if (_offlineQueue.Count == 0 || _isRetrying) yield break;

            // 检查是否到了重试时间
            if (Time.time - _lastRetryTime < _retryDelay)
            {
                yield break;
            }

            _isRetrying = true;

            List<LogData> logs = new List<LogData>();
            while (_offlineQueue.Count > 0 && logs.Count < 50)
            {
                logs.Add(_offlineQueue.Dequeue());
            }

            if (logs.Count > 0)
            {
                yield return SendLogsBatchCoroutine(logs);
            }

            _isRetrying = false;
        }

        /// <summary>
        /// 获取离线队列大小
        /// </summary>
        public int GetOfflineQueueSize()
        {
            return _offlineQueue.Count;
        }

        /// <summary>
        /// 获取下次重试时间
        /// </summary>
        public float GetNextRetryTime()
        {
            return _lastRetryTime + _retryDelay;
        }

        /// <summary>
        /// 序列化日志列表为JSON
        /// </summary>
        private string SerializeLogs(List<LogData> logs)
        {
            // 将日志转换为传输格式
            var logsForTransmission = new LogTransmission[logs.Count];
            
            for (int i = 0; i < logs.Count; i++)
            {
                var log = logs[i];
                logsForTransmission[i] = new LogTransmission
                {
                    sessionId = log.sessionId,
                    logType = log.logType,
                    level = log.level,
                    message = log.message,
                    stackTrace = log.stackTrace,
                    metadata = log.metadata,
                    tags = log.tags,
                    timestamp = log.timestamp,
                    clientVersion = log.clientVersion
                };
            }
            
            var request = new BatchLogsRequest { logs = logsForTransmission };
            return JsonConvert.SerializeObject(request, JsonSettings.Default);
        }
    }
}
