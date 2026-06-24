# GameLog Reporter SDK

Unity 游戏日志上报 SDK —— **自启动**、自动收集日志、批量上报、离线缓存、去重、会话管理。

## 安装（UPM）

SDK 通过 `upm` 分支发布（包根即仓库根，URL 无需 `?path=`）。

**公司内网（GitLab）**，在 `Packages/manifest.json` 的 `dependencies` 中加入：

```json
"com.gamelogreporter.sdk": "https://github.com/leohu-hcl/GameLogReporter.git#upm"
```

或通过 Package Manager → **Add package from git URL**：

```
https://github.com/leohu-hcl/GameLogReporter.git#upm
```

> 外部网络可改用 GitHub 源：`https://github.com/leohu-hcl/GameLogReporter.git#upm`
> 锁定版本可把 `#upm` 换成具体 tag（如 `#upm-v0.1.0`）。

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
| `enableDeduplication` | `true` | 日志去重 |
| `deduplicationWindow` | `10` | 去重时间窗口（秒） |
| `enableOfflinePersistence` | `true` | 离线持久化（退出/失败落盘，下次启动补发） |
| `enableSdkLogging` | `true` | SDK 自身是否打印到控制台 |

## 日志等级 / 类型

- 等级：`Debug` / `Info` / `Warning` / `Error` / `Critical`
- 类型：`Performance` / `UserAction` / `SystemLog` / `Custom`

## 启用（编译期开关）

SDK 默认**不参与编译、不进 player 构建**。需要启用时，在 **Project Settings → Player → Scripting Define Symbols** 中加入：

```
GAMELOG_REPORTER_ENABLED
```

加上后整个 SDK 程序集才会编译，自启动与自动日志收集随即生效。未定义该宏时 SDK 完全不存在于构建中——正式发行版若想彻底移除上报，去掉这个宏即可。

> 注意：未定义该宏时，任何对 `LogReporter` 的**直接 API 调用**（如 `LogReporter.Instance.ReportCustom(...)`）会编译报错。请用 `#if GAMELOG_REPORTER_ENABLED` 包裹这些调用点；仅依赖自动日志收集则无需改动。

## 许可证

MIT
