# SQL 参数错误修复总结

## 问题描述
所有后端 API 返回 500 错误：`Incorrect arguments to mysqld_stmt_execute`

## 根本原因
MySQL2 驱动要求 `LIMIT` 和 `OFFSET` 参数必须是**纯数字类型**，不能是：
- 字符串（即使是数字字符串如 "10"）
- undefined
- null
- NaN

## 已修复的文件

### 1. `/backend/src/services/UserService.ts`
- ✅ `findAll` 方法（第 154-156 行）
- ✅ `findStudents` 方法（第 207-209 行）

### 2. `/backend/src/services/CourseService.ts`
- ✅ `findAll` 方法（第 148-150 行）
- ✅ `getCourseStudents` 方法（第 206-208 行）

### 3. `/backend/src/controllers/QuestionController.ts`
- ✅ `getQuestions` 方法（第 51-54 行）

### 4. `/backend/src/controllers/ExamController.ts`
- ✅ `getExams` 方法（第 63-66 行）

### 5. `/backend/src/controllers/GradeController.ts`
- ✅ `getGrades` 方法（第 49-52 行）

## 修复方案

### 修复前：
```typescript
const items = await executeQuery(sql, [...params, pageSize, offset]);
```

### 修复后：
```typescript
const limitNum = Number(pageSize) || 10;
const offsetNum = Number(offset) || 0;
const items = await executeQuery(sql, [...params, limitNum, offsetNum]);
```

## 验证步骤

1. 重启后端服务
2. 登录获取 token
3. 测试各个 API 端点

## 当前状态
- ✅ 代码已修复
- ⏳ 等待 nodemon 重新加载
- ⏳ 需要验证所有 API

## 下一步
如果问题仍然存在，可能需要：
1. 检查 `executeQuery` 函数的实现
2. 检查 MySQL2 连接配置
3. 添加详细的参数日志
