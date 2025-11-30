#!/bin/bash

# 税务综合实训平台开发环境启动脚本

echo "🚀 启动税务综合实训平台开发环境..."

# 检查Node.js版本
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未安装Node.js"
    echo "请安装Node.js 18+: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $NODE_VERSION"

# 检查MySQL服务
if ! command -v mysql &> /dev/null; then
    echo "❌ 错误: 未安装MySQL"
    echo "请安装MySQL 8.0+并启动服务"
    exit 1
fi

echo "✅ MySQL已安装"

# 检查项目根目录
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动后端服务
echo "📡 启动后端服务..."
cd backend

# 检查后端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚙️ 创建环境变量文件..."
    cp .env.example .env
    echo "请编辑 backend/.env 文件配置数据库连接信息"
fi

# 启动后端开发服务器
echo "🔧 启动后端开发服务器..."
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务PID: $BACKEND_PID"

# 等待后端服务启动
sleep 3

# 检查后端服务是否启动成功
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ 后端服务启动失败，请检查日志: logs/backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ 后端服务启动成功: http://localhost:3001"

# 启动前端服务
echo "🌐 启动前端服务..."
cd ../frontend

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务PID: $FRONTEND_PID"

# 等待前端服务启动
echo "⏳ 等待前端服务启动..."
sleep 10

# 检查前端服务是否启动成功
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ 前端服务启动失败，请检查日志: logs/frontend.log"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "✅ 前端服务启动成功: http://localhost:3000"

# 保存进程ID到文件
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "🎉 开发环境启动完成!"
echo "📱 前端地址: http://localhost:3000"
echo "📡 后端地址: http://localhost:3001"
echo "📊 健康检查: http://localhost:3001/health"
echo "📝 查看日志: tail -f logs/backend.log 或 tail -f logs/frontend.log"
echo "🛑 停止服务: ./scripts/stop-dev.sh"
echo ""
echo "默认管理员账户:"
echo "用户名: admin"
echo "密码: password (首次登录后请修改)"
echo ""

# 等待用户输入停止服务
echo "按 Ctrl+C 停止所有服务..."
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f logs/*.pid; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done
