#!/bin/bash

# 数据库初始化脚本

echo "🗄️ 初始化税务综合实训平台数据库..."

# 默认配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-tax_training_platform}

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo "❌ 错误: 未安装MySQL客户端"
    echo "请先安装MySQL: sudo apt-get install mysql-client"
    exit 1
fi

# 检查MySQL服务是否运行
if ! mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" --silent 2>/dev/null; then
    echo "❌ 错误: MySQL服务未运行或无法连接到 $DB_HOST:$DB_PORT"
    echo "请启动MySQL服务: sudo systemctl start mysql"
    exit 1
fi

# 提示输入密码
echo "请输入MySQL root密码 (如果没有密码请直接按回车):"
read -s DB_PASSWORD

# 测试数据库连接
echo "🔍 测试数据库连接..."
mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo "✅ 数据库连接成功"

# 检查数据库是否存在
DB_EXISTS=$(mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_NAME';" | grep $DB_NAME)

if [ -n "$DB_EXISTS" ]; then
    echo "⚠️ 数据库 $DB_NAME 已存在"
    echo "是否要重新创建数据库? (这将删除所有现有数据) [y/N]:"
    read -r RECREATE
    
    if [[ $RECREATE =~ ^[Yy]$ ]]; then
        echo "🗑️ 删除现有数据库..."
        mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo "📊 使用现有数据库"
        exit 0
    fi
fi

# 创建数据库
echo "🏗️ 创建数据库 $DB_NAME..."
mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ $? -ne 0 ]; then
    echo "❌ 数据库创建失败"
    exit 1
fi

echo "✅ 数据库创建成功"

# 导入初始化脚本
if [ -f "database/init.sql" ]; then
    echo "📥 导入数据库结构和初始数据..."
    mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME < database/init.sql
    
    if [ $? -ne 0 ]; then
        echo "❌ 数据库初始化失败"
        exit 1
    fi
    
    echo "✅ 数据库初始化完成"
else
    echo "❌ 未找到数据库初始化文件: database/init.sql"
    exit 1
fi

# 创建专用数据库用户（可选）
echo "是否创建专用数据库用户? [y/N]:"
read -r CREATE_USER

if [[ $CREATE_USER =~ ^[Yy]$ ]]; then
    echo "请输入新用户名 (默认: tax_user):"
    read -r NEW_USER
    NEW_USER=${NEW_USER:-tax_user}
    
    echo "请输入新用户密码:"
    read -s NEW_PASSWORD
    
    echo "🔐 创建数据库用户 $NEW_USER..."
    mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "
        CREATE USER IF NOT EXISTS '$NEW_USER'@'%' IDENTIFIED BY '$NEW_PASSWORD';
        GRANT SELECT, INSERT, UPDATE, DELETE ON $DB_NAME.* TO '$NEW_USER'@'%';
        FLUSH PRIVILEGES;
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库用户创建成功"
        echo ""
        echo "请在 backend/.env 文件中使用以下配置:"
        echo "DB_USER=$NEW_USER"
        echo "DB_PASSWORD=$NEW_PASSWORD"
        echo "DB_NAME=$DB_NAME"
    else
        echo "❌ 数据库用户创建失败"
    fi
fi

echo ""
echo "🎉 数据库初始化完成!"
echo "📊 数据库名称: $DB_NAME"
echo "🌐 主机地址: $DB_HOST:$DB_PORT"
echo ""
echo "默认管理员账户:"
echo "用户名: admin"
echo "密码: password"
echo ""
echo "请确保在 backend/.env 文件中配置正确的数据库连接信息"
