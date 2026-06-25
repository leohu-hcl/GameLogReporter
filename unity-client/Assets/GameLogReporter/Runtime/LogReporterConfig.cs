using UnityEngine;

namespace GameLogReporter
{
    /// <summary>
    /// LogReporter 配置 - 通过 ScriptableObject 提供，或用 LogReporter.Configure(...) 在代码中覆盖。
    ///
    /// 自启动时的解析优先级（高 → 低）：
    ///   1. 代码 LogReporter.Configure(...) 设置的覆盖配置
    ///   2. Resources 下名为 "LogReporterConfig" 的资源
    ///   3. 内置默认值（本类字段默认值）
    /// </summary>
    [CreateAssetMenu(
        fileName = "LogReporterConfig",
        menuName = "GameLogReporter/Config",
        order = 0)]
    public class LogReporterConfig : ScriptableObject
    {
        /// <summary>Resources 中约定的资源名（不含扩展名）。</summary>
        public const string ResourceName = "LogReporterConfig";

        [Header("Server")]
        [Tooltip("服务器 API 根地址，例如 http://localhost:3000/api")]
        public string apiBaseUrl = "http://localhost:3000/api";

        [Tooltip("客户端版本号，随日志一起上报")]
        public string clientVersion = "1.0.0";

        [Header("Batching")]
        [Tooltip("批量上报间隔（秒）")]
        public float batchInterval = 5f;

        [Tooltip("单批上报的日志条数上限")]
        public int batchSize = 50;

        [Header("Deduplication")]
        [Tooltip("启用日志去重")]
        public bool enableDeduplication = true;

        [Tooltip("去重时间窗口（秒）")]
        public float deduplicationWindow = 10f;

        [Header("Offline")]
        [Tooltip("启用离线持久化（退出/网络失败时未发日志落盘，下次启动补发）")]
        public bool enableOfflinePersistence = true;

        [Header("SDK Logging")]
        [Tooltip("SDK 自身是否向 Unity 控制台打印日志")]
        public bool enableSdkLogging = true;

        /// <summary>
        /// 克隆一份配置（用于代码覆盖时不污染 Resources 原始资源）。
        /// </summary>
        public LogReporterConfig Clone()
        {
            return (LogReporterConfig)Instantiate(this);
        }
    }
}
