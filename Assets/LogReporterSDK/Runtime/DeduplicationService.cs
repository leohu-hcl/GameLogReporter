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
                    // 超过时间窗口，上报之前的日志（带重复次数），然后缓存新日志
                    // 这里返回的是原始日志，因为需要先处理旧日志
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
        /// 获取需要上报的去重日志
        /// </summary>
        public List<LogData> GetDeduplicatedLogs()
        {
            var logs = new List<LogData>();
            
            foreach (var kvp in _deduplicationCache)
            {
                if (kvp.Value.repeatCount > 0)
                {
                    var logData = kvp.Value.logData;
                    
                    // 将重复次数添加到metadata
                    if (logData.metadata == null)
                    {
                        logData.metadata = new Dictionary<string, object>();
                    }
                    logData.metadata["_repeatCount"] = kvp.Value.repeatCount;
                    logData.metadata["_deduplicated"] = true;

                    // 更新消息，包含重复次数
                    logData.message = $"{logData.message} (重复 {kvp.Value.repeatCount} 次)";
                    
                    logs.Add(logData);
                }
                else
                {
                    logs.Add(kvp.Value.logData);
                }
            }
            
            return logs;
        }
        
        /// <summary>
        /// 清理过期的去重缓存
        /// </summary>
        public void CleanupDeduplicationCache()
        {
            float currentTime = Time.time;
            List<string> keysToRemove = new List<string>();

            foreach (var kvp in _deduplicationCache)
            {
                // 如果超过时间窗口，移除
                if (currentTime - kvp.Value.firstTime > _deduplicationWindow)
                {
                    keysToRemove.Add(kvp.Key);
                }
            }

            foreach (var key in keysToRemove)
            {
                _deduplicationCache.Remove(key);
            }
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
                _deduplicationCache.Remove(entry.Key);
            }
        }
        
        /// <summary>
        /// 生成日志签名（用于去重判断）
        /// </summary>
        private string GenerateLogSignature(LogData logData)
        {
            // 基于消息内容、堆栈跟踪、日志类型和级别生成签名
            string message = logData.message ?? "";
            string stackTrace = logData.stackTrace ?? "";
            
            // 使用哈希码生成更高效的签名
            int hash = 17;
            hash = hash * 23 + logData.logType.GetHashCode();
            hash = hash * 23 + logData.level.GetHashCode();
            hash = hash * 23 + (message?.GetHashCode() ?? 0);
            hash = hash * 23 + (stackTrace?.GetHashCode() ?? 0);
            
            return hash.ToString();
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