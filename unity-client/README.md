# GameLogReporter Unity Client

基于 Unity 的游戏日志报告系统客户端SDK。

## 🚀 功能特性

- **日志收集** - 自动捕获游戏日志、错误、警告
- **性能监控** - FPS、内存使用、加载时间监控
- **用户行为追踪** - 用户操作事件记录
- **会话管理** - 自动会话创建、生命周期管理
- **离线支持** - 离线日志缓存、网络恢复自动上报
- **去重机制** - 日志自动去重、避免重复上报
- **批量上报** - 高效的批量日志上报机制

## 📋 技术栈

- **Unity** - 游戏引擎
- **C#** - 编程语言
- **HTTP Client** - 网络通信
- **JSON** - 数据序列化

## 🛠️ 安装

### 方式1：Import Unitypackage

1. 在Unity项目中，选择 `Assets > Import Package > Custom Package`
2. 选择 `LogReporterSDK.unitypackage` 文件
3. 导入所有文件

### 方式2：手动复制

1. 将 `Assets/LogReporterSDK` 文件夹复制到你的项目
2. 确保所有脚本都在正确的位置

## 📖 快速开始

### 基础使用

```csharp
using GameLogReporter;

// 获取SDK实例
LogReporter logReporter = LogReporter.Instance;

// 上报错误日志
logReporter.ReportCustom("游戏启动", LogLevel.Info);

// 上报异常
try {
    // 你的代码
} catch (Exception e) {
    logReporter.ReportCustom(e.Message, LogLevel.Error);
}

// 上报性能指标
logReporter.ReportPerformance(fps: 60, memoryMB: 256);

// 上报用户行为
logReporter.ReportUserAction("玩家点击了开始按钮");
```

### 配置

在LogReporter组件的Inspector面板中配置：

- **API Base URL** - 服务器地址，例如：`http://localhost:3000/api`
- **Client Version** - 客户端版本
- **Batch Interval** - 批量上报间隔（秒）
- **Batch Size** - 每次上报的日志数量
- **Enable Performance Monitoring** - 启用性能监控
- **Enable User Action Tracking** - 启用用户行为追踪
- **Enable Deduplication** - 启用日志去重

## 📁 项目结构

```
Assets/LogReporterSDK/
├── Runtime/
│   ├── LogReporter.cs           # 主 SDK 类（自启动入口）
│   ├── LogReporterConfig.cs     # 配置（ScriptableObject）
│   ├── SessionManager.cs        # 会话管理
│   ├── NetworkManager.cs        # 上报调度与重试
│   ├── HttpClient.cs            # HTTP 通信
│   ├── LogCollector.cs          # 日志收集
│   ├── LogStore.cs              # 内存队列与离线落盘
│   ├── DeduplicationService.cs  # 去重服务
│   ├── LogData.cs               # 日志数据模型与枚举
│   ├── JsonSettings.cs          # JSON 序列化配置
│   └── SdkLogger.cs             # SDK 自身日志
├── Editor/                      # 编辑器工具（配置生成）
└── Tests/                       # 单元测试
```


## 🔄 工作流程

1. **初始化** - SDK自动初始化，创建会话
2. **收集** - 自动捕获日志、性能数据、用户操作
3. **缓存** - 日志存储在内存队列中
4. **批量上报** - 按照配置的间隔或达到批量大小时上报
5. **离线处理** - 网络不可用时缓存到本地
6. **重试机制** - 上报失败自动重试

## ⚙️ 日志等级

- `Debug` - 调试信息
- `Info` - 一般信息
- `Warning` - 警告
- `Error` - 错误
- `Critical` - 严重错误

## 📊 日志类型

- `Error` - 异常错误
- `Warning` - 警告信息
- `Info` - 一般信息
- `Performance` - 性能数据
- `UserAction` - 用户行为
- `Custom` - 自定义数据

## 📝 许可证

MIT
