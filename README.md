# GameLogReporter

一套面向游戏的**日志上报与管理平台**，由三部分组成：

| 模块 | 技术栈 | 作用 |
|---|---|---|
| **unity-client** | Unity / C# | 嵌入游戏的 SDK，自动收集日志、性能、用户行为并批量上报 |
| **server** | Node.js + Express + MongoDB | 接收日志、提供查询/统计 API、WebSocket 实时推送、用户与权限管理 |
| **web** | Next.js 16 + React 19 + Tailwind | 管理后台：日志检索、仪表板、设备/会话、告警、用户管理 |

```
Unity 游戏  ──(HTTP 批量上报)──►  server  ──►  MongoDB
                                    │
                                    └──(REST / WebSocket)──►  web 管理后台
```

## ✨ 功能特性

- **自动收集**：SDK 自启动，自动捕获 `Debug.Log/LogWarning/LogError`，无需改动游戏代码
- **批量 + 离线**：批量上报、网络断开时本地缓存、恢复后自动补发、自动去重
- **实时查询**：日志列表筛选、详情、导出，WebSocket 实时推送新日志
- **数据分析**：仪表板统计、会话/设备汇总、告警规则
- **权限管理**：JWT 认证 + 基于角色的访问控制（Admin / Editor / Viewer）

## 🚀 快速开始（Docker，推荐）

需要 [Docker](https://www.docker.com/) 与 Docker Compose。

```bash
# 1. 配置环境变量
cp .env.example .env
#    打开 .env，至少把 JWT_SECRET 改成一个随机字符串

# 2. 启动（首次会自动构建镜像并创建管理员账号）
docker compose up -d
```

启动后：

- 管理后台：http://localhost:3001
- 后端 API：http://localhost:3010/api
- 默认管理员账号：`admin@gamelog.com` / `Admin@123456`（**首次登录后请尽快修改**）

> 端口说明：容器内 server 监听 3000，对外映射为 **3010**；web 对外为 **3001**。
> 本地不走 Docker 直接 `npm run dev` 时，server 默认端口是 **3000**。

## 🛠️ 本地开发

分别启动三部分（需要 Node.js ≥ 18 和一个本地 MongoDB）：

```bash
# 后端
cd server && npm install
cp .env.example .env          # 按需修改
npm run seed                  # 创建默认管理员账号
npm run dev                   # http://localhost:3000

# 前端
cd web && npm install
cp .env.example .env.local    # 按需修改后端地址
npm run dev                   # http://localhost:3001
```

Unity SDK 的接入方式见 [`unity-client/Assets/LogReporterSDK/README.md`](unity-client/Assets/LogReporterSDK/README.md)。

## 📦 各模块文档

- [server/README.md](server/README.md) — 后端 API 服务
- [web/README.md](web/README.md) — 管理后台前端
- [unity-client/Assets/LogReporterSDK/README.md](unity-client/Assets/LogReporterSDK/README.md) — Unity SDK 接入指南

## 📁 仓库结构

```
GameLogReporter/
├── server/          # 后端 API（Express + MongoDB）
├── web/             # 管理后台（Next.js）
├── unity-client/    # Unity 客户端工程与 SDK
├── docker-compose.yml
└── .env.example
```

## 📝 许可证

[MIT](LICENSE)
