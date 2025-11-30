#!/bin/bash

# 税务综合实训平台开发环境停止脚本

echo "🛑 停止税务综合实训平台开发环境..."

# 检查PID文件是否存在
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ 后端服务已停止"
    else
        echo "⚠️ 后端服务进程不存在"
    fi
    rm -f logs/backend.pid
else
    echo "⚠️ 未找到后端服务PID文件"
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🎨 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    else
        echo "⚠️ 前端服务进程不存在"
    fi
    rm -f logs/frontend.pid
else
    echo "⚠️ 未找到前端服务PID文件"
fi

# 强制杀死可能残留的Node.js进程
echo "🧹 清理残留进程..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

echo "✅ 开发环境已完全停止"
