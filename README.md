# 税务综合实训平台

一个功能完整的税务教学管理系统，支持教师和学生的在线教学、考试、成绩管理等功能。

## 项目架构

- **前端**: React + TypeScript + Ant Design
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL
- **部署**: 前后端分离架构

## 功能模块

### 核心功能
- 🔐 用户认证系统（教师/学生登录）
- 👨‍🏫 教师管理（信息管理、权限分配）
- 👨‍🎓 学生管理（信息管理、班级管理）
- 📚 课程管理（课程创建、内容管理）
- 📝 试题管理（试题库、分类管理）
- 📊 考试管理（在线考试、自动评分）
- 📈 成绩管理（统计分析、报告导出）
- ⚙️ 系统设置（基础配置、权限管理）

## 项目结构

```
Tax-Training-Platform/
├── frontend/          # 前端应用
├── backend/           # 后端API服务
├── database/          # 数据库脚本
├── docs/             # 项目文档
└── deploy/           # 部署配置
```

## 快速开始

### 一键启动（推荐）
```bash
# 1. 初始化数据库
./scripts/setup-db.sh

# 2. 启动开发环境
./scripts/start-dev.sh

# 3. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:3001
# 默认账户: admin / password
```

### 手动启动
```bash
# 前端开发
cd frontend
npm install
npm start

# 后端开发
cd backend
npm install
npm run dev

# 数据库设置
cd database
mysql -u root -p < init.sql
```

### Docker部署
```bash
cd deploy
cp .env.example .env
# 编辑.env文件配置
docker-compose up -d
```

## 开发团队

基于原系统功能复刻开发
