# LogReporter SDK — 代码 Review 待办

> 记录时间：2026-06-22
> 范围：`Assets/LogReporterSDK/Scripts/*` + `Assets/Scripts/LogReporterTester.cs`
> 状态图例： [ ] 未处理 · [~] 处理中 · [x] 已修复

整体：分层清晰（Reporter / Collector / Network / Dedup / Session / Http），注释完整，
退避与队列上限都有考虑。但存在若干会导致**丢日志 / 序列化失败 / 线程崩溃**的真实问题。

---

## 🔴 严重（功能不工作 / 数据丢失）

- [x] **#1 `JsonUtility` 不支持 `Dictionary` 与 `DateTime` → metadata 永远丢失**
  - 位置：`NetworkManager.SerializeLogs` 用 `JsonUtility.ToJson`；`LogData.metadata` 是 `Dictionary<string,object>`，`timestamp` 是 `DateTime`
  - 后果：性能数据(fps/memory)、用户行为参数、自定义字段、时间戳全部传不到服务器
  - **已修（2026-06-23）**：引入 Newtonsoft.Json（package.json 依赖 + asmdef 引用）。新增 `Runtime/JsonSettings.cs` 统一设置；`NetworkManager.SerializeLogs`、`HttpClient` 泛型 Post 改用 `JsonConvert`。metadata/DateTime 正确序列化。

- [x] **#2 枚举默认序列化为数字，与 Web 端期望的字符串不一致**
  - `logType`/`level` 经 `JsonUtility` 变成 int（0,1,2…），Web 端期望 `'error'/'warning'/'performance'…`
  - 后果：级别 / 类型在服务端全部错位
  - **已修（2026-06-23）**：`GameLogType`/`LogLevel` 标 `[EnumMember(Value="...")]` + `StringEnumConverter`，发后端约定的小写字符串（`performance`/`user_action`/`error`…）。后端 `LogService` 的数字兼容映射（本就有 logType 错位 bug）已删除。
  - 连带修复：`SessionManager.EndSession` 原传字符串 `"{}"` 作请求体，改用 `new object()`（JsonConvert 下序列化为合法 `{}`）。

- [x] **#3 日志队列非线程安全**
  - `Application.logMessageReceived` 在后台线程产生的日志会在非主线程回调 → `ReportLog` → `_logQueue.Enqueue`，与主线程 `Update()` 的 `Dequeue` 并发
  - `Queue<T>` 非线程安全，并发读写会抛异常 / 队列损坏
  - 附带：`DeduplicationService` 访问 `Time.time`（仅主线程安全）同样有隐患
  - **已修（2026-06-23）**：生产者/消费者模式。新增 `ConcurrentQueue<LogData> _incomingQueue`；
    `ReportLog` 瘦身为「仅入并发队列」（任意线程安全，不碰 Time.time/_logQueue）；
    新增 `DrainIncoming()` 在主线程 `Update` 开头 + `OnApplicationQuit` 执行去重/限长/入 `_logQueue`。
    `_logQueue` 与 `DeduplicationService` 从此主线程独占。

---

## 🟠 中等（边界 / 健壮性）

- [x] **#4 去重会吞掉重复日志的上报**
  - 窗口内重复仅 `repeatCount++`，带次数的日志只在 `OnApplicationQuit` 经 `GetDeduplicatedLogs` 上报；崩溃/被杀则全丢
  - 窗口过期分支（`ShouldDeduplicate` 的 else）直接覆盖缓存，**未把累计 repeatCount 入队上报** → 计数清零丢失
  - **已修（2026-06-23）**：`DeduplicationService` 新增 `_pendingReport` + `BuildReportLog()`；窗口过期（ShouldDeduplicate else）、定期清理（CleanupDeduplicationCache 改返回 `List<LogData>`）、容量清理（CleanupOldestDeduplicationEntries）三处都把带 count 的旧日志加工后产出，由 `LogReporter` 入队上报。顺带修正 `GetDeduplicatedLogs` 退出时只产出 count>0（首次日志已入队过，避免重复上报）。配合 #7 落盘，崩溃也不丢。

- [x] **#5 自动性能监控根本没运行 + `1f/Time.deltaTime` 可能为 Infinity**
  - `LogReporter.Update()` 从未调用 `_logCollector.Update()` → `enablePerformanceMonitoring` 形同虚设（只有 Tester 手动触发）
  - `CollectPerformanceData` 的 `1f/Time.deltaTime` 在 deltaTime=0 时为 Infinity
  - **已修（2026-06-23）**：关注点分离——性能/行为自动采集不属于日志 SDK 核心职责，且这些是死代码（Update/TrackUserAction 从没被调用）。直接**剥离** `LogCollector` 的自动采集（删 `Update`/`CollectPerformanceData`/`TrackUserAction` + 相关字段），`Initialize()` 改无参；`LogReporterConfig` 删 `enablePerformanceMonitoring`/`enableUserActionTracking`/`performanceCheckInterval`。两个 bug 随死代码删除而消失。保留 `LogReporter.ReportPerformance()`/`ReportUserAction()` 作手动上报便捷 API。

- [x] **#6 `OnApplicationQuit` 的"同步上报"是假的**
  - `SendLogsBatchSync` 实际仍是 `StartCoroutine`（异步）；OnApplicationQuit 返回后协程基本无机会执行完
  - 后果：退出时的剩余日志与 EndSession 大概率发不出（移动端尤甚）
  - **已修（2026-06-23）**：删除假同步 `SendLogsBatchSync`/`FlushLogs(sync)` 分支。`OnApplicationQuit` 改为把所有未发日志（队列 + 离线队列 + 去重缓存带 count）**落盘**，发送交给下次启动补发——退出只做快速可靠的本地写盘，不再依赖发不完的异步 HTTP。

- [x] **#7 离线队列只在内存，进程退出即丢**
  - README 宣称"离线缓存、恢复自动上报"，但 `_offlineQueue` 是纯内存 `Queue`，崩溃/退出全没
  - **已修（2026-06-23）**：新增 `Runtime/LogStore.cs` 持久化层（`persistentDataPath/logreporter/pending.json`，Newtonsoft，IO 异常吞掉）。`NetworkManager` 发送**失败即落盘**离线队列快照（崩溃也不丢）；启动时 `LogReporter` 读盘补发后清盘。可经 `enableOfflinePersistence` 配置开关关闭。README 离线描述已与实际对齐。

- [x] **#8 Update 每帧轮询 + 可能多次 Flush 的 GC 压力**
  - 每帧检查队列大小并可能多次 `StartCoroutine`；性能采集默认 1s 一条长期累积
  - **已修（2026-06-23）**：`Update` 的"定时 flush"与"按量 flush"合并为一次判断（同帧最多一次 flush）；性能采集已随 #5 剥离。

---

## 🟡 轻微（可维护性 / 一致性）

- [x] **#9 去重签名用 `string.GetHashCode()`**：有碰撞风险（误去重→漏报）、跨运行/平台不稳定。
  - **已修（2026-06-23）**：`GenerateLogSignature` 改用内容拼接 `"{logType}|{level}|{message}|{stackTrace}"` 作字典 key，无碰撞、跨平台稳定。
- [x] **#10 `LogReporter.GetDeviceInfo()` 是死代码**，与 `RequestSessionId` 内联段重复（删一个）
  - **已修（2026-06-23）**：删除未被调用的 `GetDeviceInfo()`；`RequestSessionId` 内联构造保留。
- [x] **#11 单例双重创建时序**：`Instance` getter 会 AddComponent，与 `Awake` 设值可能短暂创建两个再 Destroy
  - **已缓解（2026-06-22 UPM 改造）**：改为 `[RuntimeInitializeOnLoadMethod(BeforeSceneLoad)]` 自启动，`Bootstrap` 内先判 `_instance != null`，正常路径不再走 getter 懒创建；getter 仅作兜底。时序风险已消除，无需进一步改动。
- [x] **#12 `SdkLogger.SdkSources` + `IsSdkSource` 无人使用**（过滤实际靠 `IsSdkLog` 前缀匹配）——死代码
  - **已修（2026-06-23）**：删除 `SdkSources` 字段、`IsSdkSource` 方法及无用 `using`。
- [x] **#13 SDK 自身用 Debug.LogError 打日志 + 靠前缀过滤自己**：耦合脆弱，改日志格式即可能形成自收集回环
  - **已修（2026-06-23）**：`SdkLogger` 新增 `[ThreadStatic] _isEmitting` 重入标志，`PrintToConsole` 打印前后置位；`LogCollector.OnUnityLogReceived` 优先据此跳过（不依赖消息内容），前缀匹配降为兜底。彻底避免自收集回环。

---

## 状态
所有 13 项（🔴3 + 🟠5 + 🟡5）已全部修复 / 缓解（2026-06）。

