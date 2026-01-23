# GameLogReporter Web 前端

Next.js 14 + React 18 + TailwindCSS + shadcn/ui 技术栈的现代化 Web 管理平台。

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并修改配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 可用命令

```bash
# 开发启动
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# ESLint 检查
npm run lint

# ESLint 修复
npm run lint:fix

# Prettier 格式化
npm run format

# TypeScript 类型检查
npm run type-check
```

## 项目结构

```
src/
├── app/              # Next.js App Router 应用
├── components/       # React 组件
│   ├── common/       # 通用组件
│   ├── auth/         # 认证相关组件
│   ├── logs/         # 日志管理组件
│   ├── dashboard/    # 仪表板组件
│   ├── alerts/       # 告警组件
│   └── ui/           # shadcn/ui 组件
├── api/              # API 服务层
├── hooks/            # 自定义 React Hooks
├── types/            # TypeScript 类型定义
├── queries/          # React Query 查询
├── context/          # React Context
├── config/           # 配置文件
├── store/            # 状态管理（Zustand）
└── utils/            # 工具函数
```

## 核心功能

- ✅ 认证系统（登录/注册/密码重置）
- ✅ 日志管理（列表、搜索、过滤、详情）
- ✅ 统计仪表板（实时数据、图表）
- ✅ 告警管理（规则、事件、处理）
- ✅ WebSocket 实时更新
- ✅ 响应式设计（移动/平板/桌面）

## 技术栈

- **框架**: Next.js 14 + React 18
- **样式**: TailwindCSS + shadcn/ui
- **数据获取**: Axios + React Query
- **实时通信**: Socket.io
- **状态管理**: Zustand + Context
- **图表**: Recharts
- **代码质量**: TypeScript + ESLint + Prettier

## 部署

### Vercel（推荐）

连接 GitHub 仓库到 Vercel，自动部署。

### 其他平台

```bash
# 构建
npm run build

# 启动
npm start
```

## 开发规范

### 代码风格

- 使用 TypeScript 类型注解
- 遵循 ESLint 规则
- 使用 Prettier 自动格式化

### Git Hooks

- 提交前自动运行 ESLint 和 Prettier

### 文件命名

- 组件：PascalCase（如 `LogTable.tsx`）
- 工具/Hook：camelCase（如 `useAuth.ts`）
- 常量：UPPER_SNAKE_CASE（如 `API_TIMEOUT`）

## API 文档

API 端点基于 Server 项目，默认地址 `http://localhost:3000/api`。

### 认证

- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `POST /auth/logout` - 用户登出
- `POST /auth/refresh` - 刷新 Token
- `GET /auth/me` - 获取当前用户

### 日志

- `GET /logs` - 获取日志列表
- `GET /logs/:id` - 获取日志详情
- `GET /logs/stats` - 获取统计数据
- `POST /logs/export` - 导出日志

### 告警

- `GET /alerts` - 获取告警列表
- `POST /alert-rules` - 创建告警规则
- `PUT /alert-rules/:id` - 更新告警规则
- `DELETE /alert-rules/:id` - 删除告警规则

## 常见问题

### Q: 如何连接到后端 API？
A: 修改 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 指向后端地址。

### Q: WebSocket 连接失败？
A: 确保 `NEXT_PUBLIC_SOCKET_URL` 正确，且后端 Socket.io 服务运行正常。

### Q: 如何添加新的 shadcn/ui 组件？
A: 运行 `npx shadcn@latest add <component-name>`

## 支持

遇到问题？提交 Issue 或 Pull Request。

## 许可证

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
