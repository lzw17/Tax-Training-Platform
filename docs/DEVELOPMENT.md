# 开发指南

## 项目概述

税务综合实训平台是一个基于现代Web技术栈的教学管理系统，支持教师和学生的在线教学、考试、成绩管理等功能。

## 技术栈

### 前端
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **Zustand** - 状态管理
- **Axios** - HTTP客户端

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web框架
- **TypeScript** - 类型安全
- **MySQL** - 关系型数据库
- **JWT** - 身份认证
- **Multer** - 文件上传

### 开发工具
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Nodemon** - 开发服务器
- **Docker** - 容器化部署

## 项目结构

```
Tax-Training-Platform/
├── frontend/                 # 前端应用
│   ├── public/               # 静态资源
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── store/           # 状态管理
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── Dockerfile
├── backend/                  # 后端API
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── services/        # 业务逻辑
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── Dockerfile
├── database/                 # 数据库脚本
│   └── init.sql             # 初始化脚本
├── deploy/                   # 部署配置
│   ├── docker-compose.yml   # Docker编排
│   └── .env.example         # 环境变量示例
├── scripts/                  # 脚本文件
│   ├── start-dev.sh         # 开发环境启动
│   ├── stop-dev.sh          # 停止开发环境
│   └── setup-db.sh          # 数据库初始化
└── docs/                     # 项目文档
    ├── API.md               # API文档
    ├── DEPLOYMENT.md        # 部署指南
    └── DEVELOPMENT.md       # 开发指南
```

## 开发环境搭建

### 1. 环境要求
- Node.js 18+
- MySQL 8.0+
- Git

### 2. 克隆项目
```bash
git clone <repository-url>
cd Tax-Training-Platform
```

### 3. 数据库初始化
```bash
# 运行数据库初始化脚本
./scripts/setup-db.sh
```

### 4. 启动开发环境
```bash
# 一键启动前后端服务
./scripts/start-dev.sh
```

### 5. 访问应用
- 前端地址: http://localhost:3000
- 后端地址: http://localhost:3001
- 默认管理员: admin / password

## 开发规范

### 代码风格
- 使用ESLint和Prettier进行代码检查和格式化
- 遵循TypeScript严格模式
- 使用语义化的变量和函数命名

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

### 文件命名规范
- 组件文件使用PascalCase: `UserManagement.tsx`
- 工具函数使用camelCase: `formatDate.ts`
- 常量文件使用UPPER_CASE: `API_ENDPOINTS.ts`

## API开发

### 路由结构
```
/api
├── /auth          # 认证相关
├── /users         # 用户管理
├── /courses       # 课程管理
├── /questions     # 试题管理
├── /exams         # 考试管理
└── /grades        # 成绩管理
```

### 响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
```

### 错误处理
- 使用统一的错误处理中间件
- 返回标准的HTTP状态码
- 提供清晰的错误信息

## 前端开发

### 组件开发
- 使用函数式组件和Hooks
- 遵循单一职责原则
- 提供TypeScript类型定义

### 状态管理
- 使用Zustand进行全局状态管理
- 按功能模块划分store
- 避免过度使用全局状态

### 样式规范
- 使用Ant Design组件库
- 自定义样式使用CSS-in-JS或CSS模块
- 保持设计一致性

## 测试

### 单元测试
```bash
# 前端测试
cd frontend && npm test

# 后端测试
cd backend && npm test
```

### 集成测试
```bash
# API测试
npm run test:api

# E2E测试
npm run test:e2e
```

## 部署

### 开发环境
```bash
./scripts/start-dev.sh
```

### 生产环境
```bash
# 使用Docker Compose
cd deploy
docker-compose up -d
```

## 常见问题

### 1. 数据库连接失败
- 检查MySQL服务状态
- 验证数据库配置
- 确认网络连接

### 2. 前端无法访问API
- 检查后端服务状态
- 验证代理配置
- 检查CORS设置

### 3. 依赖安装失败
- 清除node_modules和package-lock.json
- 使用npm ci重新安装
- 检查网络连接

## 贡献指南

### 提交代码
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 发起Pull Request

### 代码审查
- 确保代码通过所有测试
- 遵循项目编码规范
- 提供清晰的提交信息

## 性能优化

### 前端优化
- 使用React.memo优化组件渲染
- 实现虚拟滚动处理大数据
- 使用懒加载减少初始包大小

### 后端优化
- 使用数据库索引优化查询
- 实现Redis缓存
- 使用连接池管理数据库连接

### 部署优化
- 启用Gzip压缩
- 使用CDN加速静态资源
- 配置负载均衡

## 安全考虑

### 认证授权
- 使用JWT进行身份认证
- 实现基于角色的权限控制
- 定期更新密钥

### 数据安全
- 对敏感数据进行加密
- 实现SQL注入防护
- 验证用户输入

### 网络安全
- 使用HTTPS加密传输
- 配置安全头信息
- 实现请求频率限制

## 监控和日志

### 应用监控
- 使用PM2监控Node.js进程
- 配置健康检查端点
- 监控系统资源使用

### 日志管理
- 使用Winston记录应用日志
- 配置日志轮转
- 集中化日志收集

## 扩展开发

### 添加新功能
1. 设计数据库表结构
2. 创建API接口
3. 实现前端界面
4. 编写测试用例
5. 更新文档

### 集成第三方服务
- 邮件服务（发送通知）
- 文件存储（OSS）
- 支付系统（在线支付）
- 视频会议（在线授课）
