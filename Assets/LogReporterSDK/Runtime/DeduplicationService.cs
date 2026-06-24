using System.Collections.Generic;
using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// 日志去重服务
    /// </summary>
    public class DeduplicationService
    {
        // 最大去重缓存大小
        private const int MAX_DEDUPE_CACHE_SIZE = 500;
        
        // 日志去重缓存：key=日志签名, value=(日志数据, 首次时间, 重复次数)
        private Dictionary<string, (LogData logData, float firstTime, int repeatCount)> _deduplicationCache = 
            new Dictionary<string, (LogData, float, int)>();
        
        private float _deduplicationWindow;
        private SdkLogger _sdkLogger;

        // 因窗口过期/容量清理而需要上报的、带重复计数的日志，暂存于此，
        // 由 CleanupDeduplicationCache() 取走（主线程）入队上报。
        private readonly List<LogData> _pendingReport = new List<LogData>();

        public DeduplicationService(float deduplicationWindow, SdkLogger sdkLogger = null)
        {
            _deduplicationWindow = deduplicationWindow;
            _sdkLogger = sdkLogger;
        }
        
        /// <summary>
        /// 检查是否应该去重
        /// </summary>
        public bool ShouldDeduplicate(LogData logData)
        {
            string signature = GenerateLogSignature(logData);
            float currentTime = Time.time;

            // 检查去重缓存是否超出最大限制
            if (_deduplicationCache.Count >= MAX_DEDUPE_CACHE_SIZE)
            {
                _sdkLogger?.Warning($"Deduplication cache reached maximum size ({MAX_DEDUPE_CACHE_SIZE}), clearing oldest entries");
                // 移除最早的一些条目
                CleanupOldestDeduplicationEntries();
            }

            if (_deduplicationCache.TryGetValue(signature, out var cached))
            {
                // 检查是否在时间窗口内
                if (currentTime - cached.firstTime <= _deduplicationWindow)
                {
                    // 在窗口内，增加重复计数
                    _deduplicationCache[signature] = (cached.logData, cached.firstTime, cached.repeatCount + 1);
                    return true; // 去重，不加入队列
                }
                else
                {
                    // 超过时间窗口：先把旧日志（若有重复计数）产出上报，再用新日志重置缓存
                    if (cached.repeatCount > 0)
                    {
                        _pendingReport.Add(BuildReportLog(cached.logData, cached.repeatCount));
                    }
                    _deduplicationCache[signature] = (logData, currentTime, 0);
                    return false; // 新日志，加入队列
                }
            }
            else
            {
                // 首次出现，加入缓存
                _deduplicationCache[signature] = (logData, currentTime, 0);
                return false; // 新日志，加入队列
            }
        }
        
        /// <summary>
        /// 把缓存中的日志加工为可上报形态（写入重复次数 metadata + 消息后缀）。
        /// </summary>
        private LogData BuildReportLog(LogData logData, int repeatCount)
        {
            if (repeatCount > 0)
            {
                if (logData.metadata == null)
                {
                    logData.metadata = new Dictionary<string, object>();
                }
                logData.metadata["_repeatCount"] = repeatCount;
                logData.metadata["_deduplicated"] = true;
                logData.message = $"{logData.message} (重复 {repeatCount} 次)";
            }
            return logData;
        }

        /// <summary>
        /// 获取需要上报的去重日志（应用退出时汇总）。
        /// 仅产出带重复计数（count&gt;0）的项——首次出现的日志在入队时已上报过，避免重复。
        /// 同时带出此前暂存的待上报日志。
        /// </summary>
        public List<LogData> GetDeduplicatedLogs()
        {
            var logs = new List<LogData>();

            if (_pendingReport.Count > 0)
            {
                logs.AddRange(_pendingReport);
                _pendingReport.Clear();
            }

            foreach (var kvp in _deduplicationCache)
            {
                if (kvp.Value.repeatCount > 0)
                {
                    logs.Add(BuildReportLog(kvp.Value.logData, kvp.Value.repeatCount));
                }
            }

            return logs;
        }

        /// <summary>
        /// 清理过期的去重缓存，并返回其中带重复计数的日志（供上报）。
        /// 同时带出此前因窗口过期即时产出、暂存的待上报日志。
        /// </summary>
        public List<LogData> CleanupDeduplicationCache()
        {
            var toReport = new List<LogData>();

            // 1. 带出暂存的待上报日志（窗口过期即时覆盖时产生）
            if (_pendingReport.Count > 0)
            {
                toReport.AddRange(_pendingReport);
                _pendingReport.Clear();
            }

            // 2. 清理过期项；带计数的产出上报
            float currentTime = Time.time;
            List<string> keysToRemove = new List<string>();

            foreach (var kvp in _deduplicationCache)
            {
                if (currentTime - kvp.Value.firstTime > _deduplicationWindow)
                {
                    keysToRemove.Add(kvp.Key);
                    if (kvp.Value.repeatCount > 0)
                    {
                        toReport.Add(BuildReportLog(kvp.Value.logData, kvp.Value.repeatCount));
                    }
                }
            }

            foreach (var key in keysToRemove)
            {
                _deduplicationCache.Remove(key);
            }

            return toReport;
        }
        
        /// <summary>
        /// 清理最早的去重缓存条目
        /// </summary>
        private void CleanupOldestDeduplicationEntries()
        {
            // 按照首次时间排序，移除最早的一部分条目
            var sortedEntries = new List<KeyValuePair<string, (LogData logData, float firstTime, int repeatCount)>>();
            foreach(var entry in _deduplicationCache)
            {
                sortedEntries.Add(entry);
            }
            
            // 按照首次时间升序排序
            sortedEntries.Sort((a, b) => a.Value.firstTime.CompareTo(b.Value.firstTime));
            
            // 移除前25%的条目（约125个）
            int entriesToRemove = Mathf.Max(1, MAX_DEDUPE_CACHE_SIZE / 4);

            for(int i = 0; i < entriesToRemove && i < sortedEntries.Count; i++)
            {
                var entry = sortedEntries[i];
                // 带重复计数的，产出待上报，避免容量清理时丢失计数
                if (entry.Value.repeatCount > 0)
                {
                    _pendingReport.Add(BuildReportLog(entry.Value.logData, entry.Value.repeatCount));
                }
                _deduplicationCache.Remove(entry.Key);
            }
        }
        
        /// <summary>
        /// 生成日志签名（用于去重判断）。
        /// 直接用内容拼接作为字典 key —— 无哈希碰撞（避免误去重漏报），也无跨平台/跨运行不稳定问题。
        /// </summary>
        private string GenerateLogSignature(LogData logData)
        {
            string message = logData.message ?? "";
            string stackTrace = logData.stackTrace ?? "";
            return $"{(int)logData.logType}|{(int)logData.level}|{message}|{stackTrace}";
        }
        
        /// <summary>
        /// 清空去重缓存
        /// </summary>
        public void Clear()
        {
            _deduplicationCache.Clear();
        }
        
        /// <summary>
        /// 获取当前缓存大小
        /// </summary>
        public int GetCacheSize()
        {
            return _deduplicationCache.Count;
        }
    }
}