# GameLog Reporter SDK

Unity 游戏日志上报 SDK —— **自启动**、自动收集日志、批量上报、离线缓存、去重、会话管理。

## 安装（UPM）

在目标项目的 `Packages/manifest.json` 的 `dependencies` 中加入：

```json
"com.gamelogreporter.sdk": "https://github.com/<user>/GameLogReporter.git?path=unity-client/Assets/LogReporterSDK#0.1.0"
```

或通过 Package Manager → **Add package from git URL**：

```
https://github.com/<user>/GameLogReporter.git?path=unity-client/Assets/LogReporterSDK#0.1.0
```

## 快速开始

SDK **自启动**：装上包、进入 Play 即自动创建 `LogReporter`（`DontDestroyOnLoad`），
无需把任何 prefab 拖进场景。Unity 的 `Debug.Log/LogWarning/LogError` 会被自动收集上报。

主动上报：

```csharp
using GameLogReporter;

LogReporter.Instance.ReportCustom("游戏启动", LogLevel.Info);
LogReporter.Instance.ReportPerformance(fps: 60, memoryMB: 256);
LogReporter.Instance.ReportUserAction("玩家点击了开始按钮");
```

## 配置

优先级（高 → 低）：**代码 `Configure` > Resources 资源 > 内置默认值**。

### 方式一：ScriptableObject 资源

`Create > GameLogReporter > Config` 新建配置资源，放到任意 `Resources/` 目录下，
**命名为 `LogReporterConfig`**（即 `Resources/LogReporterConfig.asset`）。自启动时自动加载。

### 方式二：代码配置

在自启动前（如自定义 `[RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]`）调用，
可设置包括 `apiBaseUrl` 在内的所有字段：

```csharp
LogReporter.Configure(o =>
{
    o.apiBaseUrl = "https://your-server.com/api";
    o.batchInterval = 3f;
    o.enableDeduplication = true;
});
```

> 自启动后调用 `Configure` 仅热更非网络字段；`apiBaseUrl` 变更需在自启动前设置。

### 可配置项

| 字段 | 默认 | 说明 |
|---|---|---|
| `apiBaseUrl` | `http://localhost:3000/api` | 服务器 API 根地址 |
| `clientVersion` | `1.0.0` | 客户端版本号 |
| `batchInterval` | `5` | 批量上报间隔（秒） |
| `batchSize` | `50` | 单批上报条数上限 |
| `enablePerformanceMonitoring` | `true` | 性能监控（FPS/内存） |
| `enableUserActionTracking` | `true` | 用户行为追踪 |
| `performanceCheckInterval` | `1` | 性能采集间隔（秒） |
| `enableDeduplication` | `true` | 日志去重 |
| `deduplicationWindow` | `10` | 去重时间窗口（秒） |
| `enableSdkLogging` | `true` | SDK 自身是否打印到控制台 |

## 日志等级 / 类型

- 等级：`Debug` / `Info` / `Warning` / `Error` / `Critical`
- 类型：`Performance` / `UserAction` / `SystemLog` / `Custom`

## 许可证

MIT
