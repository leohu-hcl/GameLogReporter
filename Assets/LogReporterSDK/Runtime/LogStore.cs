using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// 待发日志的本地持久化快照。
    /// 全量覆盖写到 persistentDataPath/logreporter/pending.json，用于退出/网络失败时落盘、
    /// 下次启动读盘补发。IO 异常一律吞掉（持久化失败不能拖垮游戏）。
    /// 仅主线程访问（persistentDataPath 是 Unity API）。
    /// </summary>
    internal class LogStore
    {
        private const string DirName = "logreporter";
        private const string FileName = "pending.json";

        private readonly string _dir;
        private readonly string _path;
        private readonly SdkLogger _sdkLogger;

        public LogStore(SdkLogger sdkLogger = null)
        {
            _sdkLogger = sdkLogger;
            _dir = Path.Combine(Application.persistentDataPath, DirName);
            _path = Path.Combine(_dir, FileName);
        }

        /// <summary>
        /// 全量覆盖保存。空集合等价于 Clear。
        /// </summary>
        public void Save(IEnumerable<LogData> logs)
        {
            var list = new List<LogData>(logs);
            if (list.Count == 0)
            {
                Clear();
                return;
            }

            try
            {
                if (!Directory.Exists(_dir))
                {
                    Directory.CreateDirectory(_dir);
                }
                string json = JsonConvert.SerializeObject(list, JsonSettings.Default);
                File.WriteAllText(_path, json);
                _sdkLogger?.Debug($"Persisted {list.Count} pending logs to disk", "LogStore");
            }
            catch (System.Exception ex)
            {
                _sdkLogger?.Warning($"Failed to persist logs: {ex.Message}", "LogStore");
            }
        }

        /// <summary>
        /// 读取落盘日志。文件不存在 / 损坏 → 返回空列表（不抛）。
        /// </summary>
        public List<LogData> Load()
        {
            try
            {
                if (!File.Exists(_path))
                {
                    return new List<LogData>();
                }
                string json = File.ReadAllText(_path);
                var list = JsonConvert.DeserializeObject<List<LogData>>(json, JsonSettings.Default);
                return list ?? new List<LogData>();
            }
            catch (System.Exception ex)
            {
                _sdkLogger?.Warning($"Failed to load persisted logs: {ex.Message}", "LogStore");
                return new List<LogData>();
            }
        }

        /// <summary>
        /// 删除落盘文件。
        /// </summary>
        public void Clear()
        {
            try
            {
                if (File.Exists(_path))
                {
                    File.Delete(_path);
                }
            }
            catch (System.Exception ex)
            {
                _sdkLogger?.Warning($"Failed to clear persisted logs: {ex.Message}", "LogStore");
            }
        }
    }
}
