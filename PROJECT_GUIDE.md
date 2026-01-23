# GameLogReporter - Web 前端项目文档

## 项目概述

GameLogReporter 是一个游戏日志上报与管理平台。本项目为其 Web 前端应用，使用 Next.js 14 + React 18 构建。

### 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript 5
- **样式**: Tailwind CSS v4 + shadcn/ui 组件库
- **数据**: React Query v5 + Axios（带拦截器）
- **实时**: Socket.io 客户端（已配置）
- **状态**: React Context API + Zustand（预留）
- **可视化**: Recharts（预留）

## 项目结构

```
web-new/
├── src/
│   ├── app/                  # Next.js App Router 页面
│   │   ├── (auth)/
│   │   │   ├── login/       # 登录页面
│   │   │   ├── register/    # 注册页面
│   │   │   └── reset-password/ # 密码重置
│   │   ├── dashboard/       # 仪表板
│   │   ├── logs/            # 日志列表
│   │   ├── alerts/          # 告警列表
│   │   ├── settings/        # 设置页面
│   │   └── layout.tsx       # 根布局
│   │
│   ├── components/          # React 组件
│   │   ├── ui/             # shadcn/ui 组件（自动生成）
│   │   ├── auth/           # 认证相关组件
│   │   ├── common/         # 公用组件（Layout、Header 等）
│   │   ├── logs/           # 日志相关组件
│   │   ├── dashboard/      # 仪表板组件
│   │   ├── alerts/         # 告警相关组件
│   │   └── providers.tsx   # 应用提供商包装
│   │
│   ├── hooks/              # React Hooks
│   │   ├── useLogsQueries.ts    # 日志相关 hooks
│   │   └── useAlertsQueries.ts  # 告警相关 hooks
│   │
│   ├── api/                # API 服务层
│   │   ├── client.ts       # Axios 客户端（带拦截器）
│   │   ├── auth.ts         # 认证 API
│   │   └── logs.ts         # 日志 API
│   │
│   ├── types/              # TypeScript 类型定义
│   │   ├── auth.ts         # 认证相关类型
│   │   ├── log.ts          # 日志相关类型
│   │   ├── alert.ts        # 告警相关类型
│   │   ├── common.ts       # 通用类型
│   │   └── index.ts        # 导出入口
│   │
│   ├── context/            # React Context
│   │   └── AuthContext.tsx # 认证上下文和 useAuth hook
│   │
│   ├── config/             # 配置文件
│   │   ├── env.ts          # 环境变量配置
│   │   ├── query-config.ts # React Query 配置
│   │   └── socket-config.ts# Socket.io 配置
│   │
│   ├── middleware.ts       # 路由中间件（认证）
│   └── globals.css         # 全局样式
│
├── public/                 # 静态资源
├── .env.local             # 本地环境变量
├── .env.example           # 环境变量模板
├── tsconfig.json          # TypeScript 配置
├── next.config.ts         # Next.js 配置
├── tailwind.config.ts     # Tailwind CSS 配置
├── components.json        # shadcn/ui 配置
└── package.json           # 项目依赖
```

## 关键功能

### 1. 认证系统

- **登录**: `src/app/auth/login/page.tsx`
- **注册**: `src/app/auth/register/page.tsx`
- **密码重置**: `src/app/auth/reset-password/page.tsx`
- **上下文**: `src/context/AuthContext.tsx`（包含 useAuth hook）

**特点**:
- JWT Token 存储在 localStorage
- 自动 Token 刷新（401 响应时）
- 路由级别保护（middleware）
- 组件级别保护（ProtectedRoute）

### 2. 日志管理

- **列表页面**: `src/app/logs/page.tsx`
- **表格组件**: `src/components/logs/LogsTable.tsx`
- **API 服务**: `src/api/logs.ts`
- **React Query Hooks**: `src/hooks/useLogsQueries.ts`

**功能**:
- 分页查看日志
- 按日志类型筛选
- 按日志级别筛选
- 关键字搜索
- 日志统计

### 3. 仪表板

- **仪表板页面**: `src/app/dashboard/page.tsx`
- **统计卡片**: `src/components/dashboard/DashboardStats.tsx`

**显示内容**:
- 总日志数统计
- 错误/警告数量
- 游戏类型数量
- 最近日志摘要

### 4. 告警管理（基础框架）

- **列表页面**: `src/app/alerts/page.tsx`
- **API Hooks**: `src/hooks/useAlertsQueries.ts`（TODO: 完整实现）

## 配置说明

### 环境变量

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_LOG_LEVEL=debug
```

### React Query 配置

`src/config/query-config.ts`:
- staleTime: 5 分钟
- gcTime: 10 分钟（旧的 cacheTime）
- 自动重试：1 次
- 重试延迟：指数退避

### Socket.io 配置

`src/config/socket-config.ts`:
- 传输方式：WebSocket + Polling
- 自动重连：启用
- 心跳间隔：25 秒

## API 拦截器

### 请求拦截器

自动添加：
- `Authorization` header（Bearer Token）
- `X-Request-ID` 追踪 ID
- GET 请求时禁用缓存

### 响应拦截器

处理：
- 401：自动刷新 Token
- 403、500+：抛出错误
- 网络错误：用户友好的错误消息

## 组件库 (shadcn/ui)

已安装的 12 个核心组件：
- `button`: 按钮
- `input`: 输入框
- `card`: 卡片
- `dialog`: 对话框
- `dropdown-menu`: 下拉菜单
- `table`: 表格
- `tabs`: 标签页
- `badge`: 徽章/标签
- `alert`: 警告框
- `checkbox`: 复选框
- `select`: 下拉选择
- `pagination`: 分页

## 路由保护

### 中间件保护（middleware.ts）

- 受保护路由：`/dashboard`, `/logs`, `/alerts`, `/users`, `/settings`
- 公开路由：`/auth/login`, `/auth/register`, `/auth/reset-password`

### 组件保护（ProtectedRoute）

```tsx
<ProtectedRoute requiredRole="admin">
  {/* 仅 admin 角色可访问 */}
</ProtectedRoute>
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 运行生产服务器
npm start

# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

## 项目阶段

### Phase 1: 基础框架 ✅ 完成
- ✅ 项目初始化和配置
- ✅ 认证系统（登录、注册、密码重置）
- ✅ 主布局和导航
- ✅ 日志列表页面和表格
- ✅ 仪表板基础框架
- ✅ 路由保护
- ✅ API 客户端和类型定义

### Phase 2: 日志管理 ⏳ 待开发
- React Query 自定义 hooks 完善
- 日志详情页面
- 日志导出功能
- 实时日志刷新（Socket.io）
- 日志搜索和高级筛选

### Phase 3: 告警管理 ⏳ 待开发
- 告警列表和详情
- 告警规则管理
- 告警通知
- 告警历史

### Phase 4: 数据可视化 ⏳ 待开发
- 仪表板图表（Recharts）
- 日志统计图表
- 告警趋势分析

### Phase 5: 测试和优化 ⏳ 待开发
- 单元测试
- E2E 测试
- 性能优化
- 国际化（i18n）

## 注意事项

1. **API 基地址**: 当前配置为 `http://localhost:3000/api`，需根据实际部署调整
2. **认证**: 使用 JWT Token，存储在 localStorage
3. **跨域**: 需确保后端允许前端 CORS 请求
4. **类型安全**: 所有 API 响应都有完整的 TypeScript 类型定义

## 常见任务

### 添加新的 API 服务

1. 在 `src/api/` 中创建新的服务文件
2. 使用 `apiClient` 进行请求
3. 在 `src/types/` 中定义相关类型
4. 在 `src/hooks/` 中创建 React Query hooks

### 添加新的页面

1. 在 `src/app/` 中创建新目录和 `page.tsx`
2. 使用 `ProtectedRoute` 包装（如果需要认证）
3. 使用 `Layout` 组件添加导航

### 更新导航菜单

修改 `src/components/common/Sidebar.tsx` 中的菜单项

## 浏览器兼容性

- Chrome/Edge: 最新版本
- Firefox: 最新版本
- Safari: 最新版本
- 移动浏览器: iOS Safari 12+, Chrome Mobile

## 构建信息

- 构建工具: Turbopack (Next.js 16)
- 输出: 静态预渲染 + 动态 API 路由
- 缓存策略: ISR（增量静态再生）

## 支持

如有问题，请查看：
- [Next.js 文档](https://nextjs.org/docs)
- [React Query 文档](https://tanstack.com/query/latest)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
