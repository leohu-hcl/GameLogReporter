# GameLogReporter Server

基于 Express.js 和 MongoDB 的游戏日志报告系统后端服务。

## 🚀 功能特性

- **用户认证** - JWT token认证、密码加密、token刷新机制
- **日志管理** - 完整的日志CRUD操作、批量上报、实时查询
- **会话管理** - 设备会话追踪、会话生命周期管理
- **用户管理** - 基于角色的访问控制（RBAC）、用户权限管理
- **数据分析** - 日志统计、会话统计、设备信息汇总
- **API接口** - RESTful API、分页支持、高级过滤

## 📋 技术栈

- **Node.js** - JavaScript运行时
- **Express.js** - Web框架
- **MongoDB** - NoSQL数据库
- **TypeScript** - 类型安全
- **JWT** - 认证授权
- **Bcryptjs** - 密码加密

## 🛠️ 安装

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start
```

## 📁 项目结构

```
src/
├── controllers/       # 业务逻辑控制层
├── models/           # 数据模型
├── routes/           # API路由
├── services/         # 业务服务层
├── middleware/       # 中间件
├── config/           # 配置文件
├── scripts/          # 脚本文件
└── app.ts            # 应用入口
```

## 📖 API文档

详见各路由文件中的注释说明。

## 🔒 安全特性

- JWT Token认证
- 密码bcrypt加密存储
- SQL注入防护
- CORS配置
- 请求速率限制

## 📝 许可证

MIT
