# GameLogReporter

一套面向游戏的**日志上报与管理平台**，由三部分组成：

| 模块 | 技术栈 | 作用 |
|---|---|---|
| **unity-client** | Unity / C# | 嵌入游戏的 SDK，自动收集日志并批量上报，性能/行为可手动上报 |
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

Unity SDK 的接入方式见 [`unity-client/Assets/GameLogReporter/README.md`](unity-client/Assets/GameLogReporter/README.md)。

### 常用脚本

```bash
# server/
npm run dev          # 开发（ts-node-dev 热重载）
npm run build        # 编译到 dist/
npm start            # 运行编译产物
npm run seed         # 创建默认管理员账号
npm run seed:logs    # 灌入测试日志

# web/
npm run dev          # 开发服务器（端口 3001）
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 类型检查
```

## 📁 仓库结构

```
GameLogReporter/
├── server/                  # 后端 API（Express + MongoDB + TypeScript）
│   └── src/
│       ├── controllers/     # 请求处理
│       ├── services/        # 业务逻辑
│       ├── models/          # Mongoose 数据模型
│       ├── routes/          # 路由
│       ├── middleware/      # 鉴权、限流、校验等中间件
│       └── scripts/         # seed / 清理脚本
├── web/                     # 管理后台（Next.js App Router）
│   └── src/
│       ├── app/             # 页面
│       ├── components/      # UI 组件（common / ui / 业务域）
│       ├── api/ + hooks/    # 数据请求层（Axios + React Query）
│       └── context/         # 全局状态（认证、主题、设置）
├── unity-client/            # Unity 客户端工程
│   └── Assets/GameLogReporter/   # 可作为 UPM 包发布的 SDK
├── docker-compose.yml
└── .env.example
```

## 📝 许可证

[MIT](LICENSE)
