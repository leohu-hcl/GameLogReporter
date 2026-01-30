# GameLogReporter Web 前端

基于 Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui 的日志管理平台前端。

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local`，并根据后端地址修改：

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 启动开发服务器

```
npm run dev
```

默认端口为 `3001`。

## 可用脚本

```
npm run dev
npm run build
npm start
npm run lint
npm run lint:fix
npm run format
npm run type-check
```

## 项目结构（核心）

```
src/
├── app/              # Next.js App Router 页面
├── components/       # UI 组件
│   ├── common/       # 通用组件
│   ├── auth/         # 认证
│   ├── logs/         # 日志
│   ├── dashboard/    # 仪表板
│   └── ui/           # shadcn/ui
├── api/              # API 服务层
├── hooks/            # React Query hooks
├── context/          # React Context
├── types/            # 类型定义
└── config/           # 配置
```

## 功能概览

- 认证系统：登录 / 注册 / 重置密码
- 日志管理：列表、筛选、详情、导出
- 仪表板：统计概览
- 设备与会话：列表与详情
- 设置：主题与分页条数配置

## 技术栈

- Next.js 16 + React 19
- Tailwind CSS v4 + shadcn/ui
- React Query + Axios
- Socket.io Client
- TypeScript + ESLint + Prettier

## 开发规范

请参考 DEVELOPMENT_GUIDE.md。
