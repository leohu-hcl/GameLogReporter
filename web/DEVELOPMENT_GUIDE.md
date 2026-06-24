# GameLogReporter Web - 开发指南

## 开发流程

1. 获取最新代码与依赖

```
cd web
git pull origin main
npm install
```

2. 启动开发服务器

```
npm run dev
```

默认端口为 `3001`。

3. 提交前检查

```
npm run type-check
npm run lint
npm run format
npm run build
```

## 编码规范（简版）

- TypeScript：避免 `any`，为组件/接口补充类型
- React：需要交互的组件使用 `use client`
- 样式：优先使用 Tailwind 与 shadcn/ui 组件
- className 组合请按“布局 / 间距 / 颜色 / 状态”分组

## 目录约定

- 页面：src/app/**/page.tsx
- 通用组件：src/components/common
- 业务组件：src/components/<domain>
- 数据请求：src/api + src/hooks

export default function NewPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <h1>New Page Title</h1>
        {/* Content */}
      </Layout>
    </ProtectedRoute>
  );
}

// 2. 在 Sidebar 组件中添加导航链接
```

### 添加新的组件

```typescript
// 1. 创建 src/components/feature/MyComponent.tsx
'use client';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div onClick={onClick}>
      {title}
    </div>
  );
}

// 2. 在其他组件中导入使用
import { MyComponent } from '@/components/feature/MyComponent';
```

## 🐛 调试技巧

### 1. 使用 React DevTools

- 安装 [React DevTools 浏览器扩展](https://react-devtools-tutorial.vercel.app/)
- 检查组件树、Props、State

### 2. 使用网络选项卡

- 打开浏览器开发者工具 → Network 选项卡
- 检查 API 请求和响应
- 验证 Authorization header 是否正确

### 3. 使用 Console

```typescript
// 在代码中添加日志
console.log('Current user:', user);
console.error('Error details:', error);
```

### 4. 使用 VS Code 调试器

配置 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 📚 常见任务

### 获取数据并显示

```typescript
'use client';

import { useLogsList } from '@/hooks/useLogsQueries';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function MyLogsWidget() {
  const { data, isLoading, error } = useLogsList({ page: 1, limit: 10 });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <ul>
      {data.items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### 处理表单提交

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MyForm() {
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // const response = await api.submit(formData);
      console.log('Submitted:', formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-600">{error}</div>}
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ name: e.target.value })}
        placeholder="Enter name"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

### 使用认证

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h2>Welcome, {user?.username}</h2>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

## 🔄 常见工作流

### 修复 Bug

1. 在 Issue 中记录问题
2. 创建新分支: `git checkout -b fix/issue-name`
3. 修复代码
4. 运行测试: `npm run type-check && npm run lint`
5. 提交: `git commit -m "fix: 描述修复内容"`
6. 推送并创建 Pull Request

### 添加新功能

1. 在 Issue 中讨论需求
2. 创建新分支: `git checkout -b feat/feature-name`
3. 按照项目结构添加代码
4. 添加类型定义
5. 创建 Hooks 和组件
6. 添加测试
7. 提交并创建 Pull Request

### 更新依赖

```bash
# 检查过时的包
npm outdated

# 更新包
npm update

# 更新到最新版本
npm install package@latest
```

## 📊 性能优化建议

### 1. 使用 React Query 缓存

```typescript
// 设置合理的 staleTime
const { data } = useQuery({
  queryKey: ['logs'],
  queryFn: () => logService.getLogs(),
  staleTime: 5 * 60 * 1000, // 5 分钟
});
```

### 2. 代码分割

```typescript
// 使用动态导入
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
});
```

### 3. 图片优化

```typescript
import Image from 'next/image';

<Image
  src="/image.png"
  alt="Description"
  width={400}
  height={300}
  priority
/>
```

## 🚨 错误处理最佳实践

### API 错误

```typescript
import { ApiError } from '@/types/common';

try {
  const data = await logService.getLogs();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.code);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 组件错误边界

```typescript
// 为关键功能添加 try-catch
const { data } = useLogsList();

if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>加载失败，请稍后重试</AlertDescription>
    </Alert>
  );
}
```

## 🧪 测试 (即将推出)

### 单元测试

```typescript
// tests/auth.test.ts
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
```

## 📚 资源链接

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)

## 👥 代码审查检查清单

提交代码前检查：

- [ ] TypeScript 类型完整
- [ ] 无 ESLint 错误
- [ ] 代码已格式化
- [ ] 添加了必要的类型定义
- [ ] 使用了合适的 Hooks 和组件
- [ ] 错误处理完善
- [ ] UI 响应式设计
- [ ] 性能考虑（缓存、加载状态）
- [ ] 代码有适当注释
- [ ] 测试通过 (如果有)

---

**提示**: 遇到问题？查看 `PROJECT_GUIDE.md` 或 `QUICKSTART.md`
