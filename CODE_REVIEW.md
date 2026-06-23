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

- [ ] **#4 去重会吞掉重复日志的上报**
  - 窗口内重复仅 `repeatCount++`，带次数的日志只在 `OnApplicationQuit` 经 `GetDeduplicatedLogs` 上报；崩溃/被杀则全丢
  - 窗口过期分支（`ShouldDeduplicate` 的 else）直接覆盖缓存，**未把累计 repeatCount 入队上报** → 计数清零丢失
  - 方向：窗口过期时先把旧的（带 count）入队再缓存新的

- [ ] **#5 自动性能监控根本没运行 + `1f/Time.deltaTime` 可能为 Infinity**
  - `LogReporter.Update()` 从未调用 `_logCollector.Update()` → `enablePerformanceMonitoring` 形同虚设（只有 Tester 手动触发）
  - `CollectPerformanceData` 的 `1f/Time.deltaTime` 在 deltaTime=0 时为 Infinity
  - 方向：在主 Update 调用 Collector.Update；FPS 计算加保护

- [ ] **#6 `OnApplicationQuit` 的"同步上报"是假的**
  - `SendLogsBatchSync` 实际仍是 `StartCoroutine`（异步）；OnApplicationQuit 返回后协程基本无机会执行完
  - 后果：退出时的剩余日志与 EndSession 大概率发不出（移动端尤甚）
  - 方向：`Application.wantsToQuit` 阻塞 / 本地持久化下次补发

- [ ] **#7 离线队列只在内存，进程退出即丢**
  - README 宣称"离线缓存、恢复自动上报"，但 `_offlineQueue` 是纯内存 `Queue`，崩溃/退出全没
  - 方向：落地到 `Application.persistentDataPath`，或修正文案

- [ ] **#8 Update 每帧轮询 + 可能多次 Flush 的 GC 压力**
  - 每帧检查队列大小并可能多次 `StartCoroutine`；性能采集默认 1s 一条长期累积
  - 方向：合并 flush 触发；评估采集频率

---

## 🟡 轻微（可维护性 / 一致性）

- [ ] **#9 去重签名用 `string.GetHashCode()`**：有碰撞风险（误去重→漏报）、跨运行/平台不稳定。改用内容拼接或稳定哈希
- [ ] **#10 `LogReporter.GetDeviceInfo()` 是死代码**，与 `RequestSessionId` 内联段重复（删一个）
- [ ] **#11 单例双重创建时序**：`Instance` getter 会 AddComponent，与 `Awake` 设值可能短暂创建两个再 Destroy
  - 注（2026-06-22 UPM 改造）：已改为 `[RuntimeInitializeOnLoadMethod(BeforeSceneLoad)]` 自启动，
    `Bootstrap` 内先判 `_instance != null`，正常路径不再走 getter 懒创建；getter 仅作兜底保留。时序风险大幅降低，剩余边角可后续清理。
- [ ] **#12 `SdkLogger.SdkSources` + `IsSdkSource` 无人使用**（过滤实际靠 `IsSdkLog` 前缀匹配）——死代码
- [ ] **#13 SDK 自身用 Debug.LogError 打日志 + 靠前缀过滤自己**：耦合脆弱，改日志格式即可能形成自收集回环

---

## 建议修复顺序
1. #1 #2（序列化）— 否则上报数据是错/空的，其余都白搭
2. #3（线程安全）— 偶发崩溃难排查
3. #5 #4 #6（性能监控没跑 / 去重丢数据 / 退出丢数据）— 功能完整性
4. 其余按需清理
