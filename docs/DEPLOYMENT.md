# 税务综合实训平台部署指南

## 系统要求

### 开发环境
- Node.js 18+ 
- MySQL 8.0+
- Redis 7+ (可选)
- Git

### 生产环境
- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 10GB+ 磁盘空间

## 开发环境部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd Tax-Training-Platform
```

### 2. 数据库设置
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE tax_training_platform;

# 导入初始化脚本
mysql -u root -p tax_training_platform < database/init.sql
```

### 3. 后端设置
```bash
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
nano .env

# 启动开发服务器
npm run dev
```

### 4. 前端设置
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 生产环境部署

### 使用Docker Compose（推荐）

1. **准备环境文件**
```bash
cd deploy
cp .env.example .env
# 编辑.env文件，设置生产环境配置
```

2. **启动服务**
```bash
docker-compose up -d
```

3. **查看服务状态**
```bash
docker-compose ps
docker-compose logs -f
```

### 手动部署

#### 1. 后端部署
```bash
cd backend

# 安装生产依赖
npm ci --only=production

# 构建项目
npm run build

# 使用PM2启动
npm install -g pm2
pm2 start dist/index.js --name "tax-platform-api"
```

#### 2. 前端部署
```bash
cd frontend

# 安装依赖
npm ci

# 构建项目
npm run build

# 使用Nginx服务静态文件
sudo cp -r build/* /var/www/html/
```

## 配置说明

### 环境变量

#### 后端环境变量
```bash
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=tax_user
DB_PASSWORD=your_password
DB_NAME=tax_training_platform

# JWT配置
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=24h

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

#### 前端环境变量
```bash
# API地址
REACT_APP_API_URL=http://localhost:3001/api

# 应用配置
REACT_APP_TITLE=税务综合实训平台
REACT_APP_VERSION=1.0.0
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 数据库迁移

### 备份数据库
```bash
mysqldump -u root -p tax_training_platform > backup.sql
```

### 恢复数据库
```bash
mysql -u root -p tax_training_platform < backup.sql
```

## 监控和日志

### 查看应用日志
```bash
# Docker环境
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2环境
pm2 logs tax-platform-api
```

### 监控系统资源
```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
df -h
```

## 安全配置

### 1. SSL证书配置
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. 防火墙配置
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. 数据库安全
```bash
# MySQL安全配置
mysql_secure_installation

# 创建专用数据库用户
CREATE USER 'tax_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_training_platform.* TO 'tax_user'@'localhost';
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接参数
   - 检查防火墙设置

2. **前端无法访问API**
   - 检查后端服务状态
   - 验证API地址配置
   - 检查CORS设置

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 检查磁盘空间

### 日志分析
```bash
# 查看错误日志
tail -f /var/log/nginx/error.log
tail -f backend/logs/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

## 性能优化

### 1. 数据库优化
- 添加适当的索引
- 定期清理日志表
- 配置查询缓存

### 2. 前端优化
- 启用Gzip压缩
- 配置静态资源缓存
- 使用CDN加速

### 3. 后端优化
- 使用Redis缓存
- 配置连接池
- 启用集群模式

## 备份策略

### 自动备份脚本
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/tax-platform"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u root -p tax_training_platform > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 定时任务
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh
```
