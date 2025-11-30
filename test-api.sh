#!/bin/bash

echo "🧪 测试后端 API..."
echo ""

# 测试健康检查
echo "1. 测试健康检查..."
curl -s http://localhost:3001/health | python3 -m json.tool
echo ""

# 测试用户列表
echo "2. 测试用户列表 API..."
curl -s 'http://localhost:3001/api/users?page=1&limit=5' | python3 -m json.tool | head -20
echo ""

# 测试课程列表
echo "3. 测试课程列表 API..."
curl -s 'http://localhost:3001/api/courses?page=1&limit=5' | python3 -m json.tool | head -20
echo ""

# 测试试题列表
echo "4. 测试试题列表 API..."
curl -s 'http://localhost:3001/api/questions?page=1&limit=5' | python3 -m json.tool | head -20
echo ""

echo "✅ API 测试完成"
