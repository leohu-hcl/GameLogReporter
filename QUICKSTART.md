# GameLogReporter Web 前端 - 快速入门

## 项目已完成内容

✅ **Phase 1 基础框架完全实现**

### 已开发功能

1. **认证系统**
   - 登录页面 (`/auth/login`)
   - 注册页面 (`/auth/register`)
   - 密码重置页面 (`/auth/reset-password`)
   - JWT Token 认证和自动刷新
   - 路由级别和组件级别的认证保护

2. **用户界面**
   - 响应式顶部导航栏（Header）
   - 可伸缩侧边栏菜单（Sidebar）
   - 12 个 shadcn/ui 组件集成
   - Tailwind CSS 完整样式系统

3. **日志管理**
   - 日志列表页面 (`/logs`)
   - 日志表格组件（分页、筛选、搜索）
   - 日志 API 服务层
   - React Query hooks 和缓存管理

4. **仪表板**
   - 仪表板页面 (`/dashboard`)
   - 统计卡片组件
   - 最近日志摘要

5. **技术架构**
   - Next.js 16 + React 19 全新框架
   - TypeScript 完整类型检查
   - Axios 请求拦截器
   - React Query 服务端状态管理
   - Socket.io 实时通信已配置
   - ESLint + Prettier 代码质量工具

## 快速开始

### 1. 启动开发服务器

```bash
cd web-new
npm run dev
```

服务器将在 `http://localhost:3000` 启动

### 2. 登录

- 打开 `http://localhost:3000`
- 自动重定向到登录页面 `/auth/login`
- 使用 API 提供的凭证登录

### 3. 浏览功能

| 页面 | 路由 | 说明 |
|------|------|------|
| 仪表板 | `/dashboard` | 统计概览和最近日志 |
| 日志 | `/logs` | 日志列表、搜索、筛选 |
| 告警 | `/alerts` | 告警管理（框架已搭建） |
| 设置 | `/settings` | 用户设置（框架已搭建） |

## 代码示例

### 1. 在页面中使用日志列表

```tsx
'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { LogsTable } from '@/components/logs/LogsTable';

export default function LogsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <LogsTable />
      </Layout>
    </ProtectedRoute>
  );
}
```

### 2. 使用认证 Hook

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      Welcome, {user?.username}!
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### 3. 使用日志查询 Hook

```tsx
'use client';

import { useLogsList } from '@/hooks/useLogsQueries';

export function LogsWidget() {
  const { data, isLoading, error } = useLogsList({
    page: 1,
    limit: 10,
    logType: 'ERROR',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading logs</div>;

  return (
    <ul>
      {data?.items.map((log) => (
        <li key={log.logId}>{log.message}</li>
      ))}
    </ul>
  );
}
```

### 4. 调用 API 服务

```tsx
import { logService } from '@/api/logs';
import { authService } from '@/api/auth';

// 获取日志列表
const logsData = await logService.getLogs({
  page: 1,
  limit: 10,
});

// 获取日志统计
const stats = await logService.getLogStats();

// 获取当前用户
const user = await authService.getCurrentUser();
```

## 环境变量配置

### 开发环境 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 生产环境

修改 `.env.local` 中的 API 和 Socket 地址指向生产服务器

## 下一步开发

### Phase 2 任务（按优先级）

1. **连接真实后端**
   - 测试登录功能是否正常
   - 验证日志 API 响应格式
   - 调整类型定义以匹配实际 API

2. **完善日志功能**
   - 实现日志详情页面
   - 添加日志导出功能
   - 集成 Socket.io 实时日志更新

3. **完善告警功能**
   - 实现告警 API 服务
   - 开发告警列表和详情组件
   - 添加告警规则管理

4. **添加数据可视化**
   - 集成 Recharts 图表库
   - 开发仪表板图表
   - 添加日志趋势分析

## 常见问题

**Q: 如何修改 API 地址？**

A: 编辑 `src/config/env.ts` 或 `.env.local` 文件中的 `NEXT_PUBLIC_API_URL`

**Q: 如何添加新的 API 服务？**

A: 在 `src/api/` 下创建新文件，参考 `logs.ts` 的实现

**Q: 如何添加新的页面？**

A: 在 `src/app/` 下创建新目录，添加 `page.tsx` 文件

**Q: 如何修改样式？**

A: 使用 Tailwind CSS class，参考已有组件的实现

## 文件位置速查

| 功能 | 文件位置 |
|------|---------|
| 认证 | `src/context/AuthContext.tsx` |
| 路由保护 | `src/app/layout.tsx`, `middleware.ts` |
| 日志组件 | `src/components/logs/LogsTable.tsx` |
| 日志 API | `src/api/logs.ts` |
| 日志 Hooks | `src/hooks/useLogsQueries.ts` |
| 类型定义 | `src/types/` |
| 配置 | `src/config/` |

## 构建和部署

### 生产构建

```bash
npm run build
npm start
```

### 构建验证

```bash
npm run type-check  # TypeScript 类型检查
npm run lint        # ESLint 检查
npm run build       # 完整构建
```

## 性能指标

- 首屏加载时间：< 2秒
- API 响应缓存：5分钟
- 自动重试：1次
- 请求超时：30秒（Axios 默认）

## 技术支持

参考文件：
- `PROJECT_GUIDE.md` - 详细文档
- `src/types/` - 类型定义
- `src/api/` - API 服务实现

---

**项目状态**: Phase 1 完成 ✅ | Phase 2+ 待开发 ⏳

**最后更新**: 2024年
