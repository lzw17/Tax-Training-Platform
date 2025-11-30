# API接口文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

## 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误信息"
}
```

### 分页响应
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## 认证接口

### 用户登录
```http
POST /auth/login
```

**请求参数**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应数据**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "real_name": "系统管理员",
      "role": "admin",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

### 用户注册
```http
POST /auth/register
```

**请求参数**
```json
{
  "username": "teacher01",
  "email": "teacher01@example.com",
  "password": "123456",
  "real_name": "张老师",
  "role": "teacher",
  "phone": "13800138000"
}
```

### 用户登出
```http
POST /auth/logout
Authorization: Bearer {token}
```

### 忘记密码
```http
POST /auth/forgot-password
```

**请求参数**
```json
{
  "email": "user@example.com"
}
```

### 重置密码
```http
POST /auth/reset-password
```

**请求参数**
```json
{
  "token": "reset_token",
  "password": "new_password"
}
```

## 用户管理接口

### 获取当前用户信息
```http
GET /users/profile
Authorization: Bearer {token}
```

### 更新用户信息
```http
PUT /users/profile
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "real_name": "新姓名",
  "phone": "13800138001",
  "avatar": "avatar_url"
}
```

### 修改密码
```http
PUT /users/password
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "oldPassword": "old_password",
  "newPassword": "new_password"
}
```

### 获取用户列表（管理员）
```http
GET /users?page=1&limit=10&search=keyword&role=teacher
Authorization: Bearer {token}
```

**查询参数**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `search`: 搜索关键词
- `role`: 用户角色筛选
- `status`: 用户状态筛选

### 创建用户（管理员）
```http
POST /users
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "username": "new_user",
  "email": "new_user@example.com",
  "password": "123456",
  "real_name": "新用户",
  "role": "student",
  "phone": "13800138000"
}
```

### 获取用户详情
```http
GET /users/{id}
Authorization: Bearer {token}
```

### 更新用户信息（管理员）
```http
PUT /users/{id}
Authorization: Bearer {token}
```

### 删除用户（管理员）
```http
DELETE /users/{id}
Authorization: Bearer {token}
```

### 获取教师列表
```http
GET /users/teachers?page=1&limit=10
Authorization: Bearer {token}
```

### 获取学生列表
```http
GET /users/students?page=1&limit=10&class_id=1
Authorization: Bearer {token}
```

## 课程管理接口

### 获取课程列表
```http
GET /courses?page=1&limit=10&search=keyword&teacher_id=1
Authorization: Bearer {token}
```

### 获取我的课程（教师）
```http
GET /courses/my
Authorization: Bearer {token}
```

### 创建课程（教师）
```http
POST /courses
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "name": "税法基础",
  "description": "课程描述",
  "credit_hours": 32,
  "cover_image": "image_url"
}
```

### 获取课程详情
```http
GET /courses/{id}
Authorization: Bearer {token}
```

### 更新课程（教师）
```http
PUT /courses/{id}
Authorization: Bearer {token}
```

### 删除课程（教师）
```http
DELETE /courses/{id}
Authorization: Bearer {token}
```

### 获取课程学生列表
```http
GET /courses/{id}/students
Authorization: Bearer {token}
```

### 添加学生到课程
```http
POST /courses/{id}/students
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "student_ids": [1, 2, 3]
}
```

### 从课程移除学生
```http
DELETE /courses/{id}/students/{student_id}
Authorization: Bearer {token}
```

## 试题管理接口

### 获取试题列表
```http
GET /questions?page=1&limit=10&type=single_choice&category=tax_law&difficulty=3
Authorization: Bearer {token}
```

**查询参数**
- `type`: 题目类型
- `category`: 题目分类
- `difficulty`: 难度等级（1-5）

### 创建试题（教师）
```http
POST /questions
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "title": "题目标题",
  "content": "题目内容",
  "type": "single_choice",
  "options": [
    {"key": "A", "value": "选项A"},
    {"key": "B", "value": "选项B"},
    {"key": "C", "value": "选项C"},
    {"key": "D", "value": "选项D"}
  ],
  "correct_answer": "A",
  "explanation": "答案解析",
  "difficulty": 3,
  "category": "tax_law",
  "tags": ["基础", "重点"]
}
```

### 获取试题详情
```http
GET /questions/{id}
Authorization: Bearer {token}
```

### 更新试题（教师）
```http
PUT /questions/{id}
Authorization: Bearer {token}
```

### 删除试题（教师）
```http
DELETE /questions/{id}
Authorization: Bearer {token}
```

### 批量导入试题（教师）
```http
POST /questions/import
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**
- `file`: Excel文件

### 导出试题（教师）
```http
GET /questions/export?category=tax_law&type=single_choice
Authorization: Bearer {token}
```

### 获取题目分类
```http
GET /questions/categories
Authorization: Bearer {token}
```

## 考试管理接口

### 获取考试列表
```http
GET /exams?page=1&limit=10&course_id=1&status=published
Authorization: Bearer {token}
```

### 创建考试（教师）
```http
POST /exams
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "title": "期末考试",
  "description": "考试描述",
  "course_id": 1,
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "duration": 120,
  "total_score": 100,
  "pass_score": 60,
  "settings": {
    "shuffle_questions": true,
    "shuffle_options": true,
    "show_result_immediately": false,
    "allow_review": true,
    "auto_submit": true
  },
  "question_ids": [1, 2, 3, 4, 5]
}
```

### 获取考试详情
```http
GET /exams/{id}
Authorization: Bearer {token}
```

### 更新考试（教师）
```http
PUT /exams/{id}
Authorization: Bearer {token}
```

### 删除考试（教师）
```http
DELETE /exams/{id}
Authorization: Bearer {token}
```

### 开始考试（学生）
```http
POST /exams/{id}/start
Authorization: Bearer {token}
```

**响应数据**
```json
{
  "success": true,
  "message": "考试开始",
  "data": {
    "record_id": 1,
    "questions": [
      {
        "id": 1,
        "title": "题目标题",
        "content": "题目内容",
        "type": "single_choice",
        "options": [
          {"key": "A", "value": "选项A"},
          {"key": "B", "value": "选项B"}
        ],
        "score": 10
      }
    ],
    "start_time": "2024-01-15T09:00:00Z",
    "end_time": "2024-01-15T11:00:00Z"
  }
}
```

### 提交考试答案（学生）
```http
POST /exams/{id}/submit
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "answers": [
    {
      "question_id": 1,
      "answer": "A"
    },
    {
      "question_id": 2,
      "answer": ["A", "B"]
    }
  ]
}
```

### 获取考试记录
```http
GET /exams/{id}/records
Authorization: Bearer {token}
```

### 获取学生考试记录
```http
GET /exams/{id}/records/{student_id}
Authorization: Bearer {token}
```

## 成绩管理接口

### 获取成绩列表
```http
GET /grades?page=1&limit=10&course_id=1&exam_id=1
Authorization: Bearer {token}
```

### 获取我的成绩（学生）
```http
GET /grades/my
Authorization: Bearer {token}
```

### 获取课程成绩统计（教师）
```http
GET /grades/course/{course_id}/stats
Authorization: Bearer {token}
```

**响应数据**
```json
{
  "success": true,
  "data": {
    "total_students": 50,
    "average_score": 78.5,
    "pass_rate": 85.2,
    "score_distribution": [
      {"range": "90-100", "count": 8, "percentage": 16},
      {"range": "80-89", "count": 15, "percentage": 30},
      {"range": "70-79", "count": 12, "percentage": 24},
      {"range": "60-69", "count": 10, "percentage": 20},
      {"range": "0-59", "count": 5, "percentage": 10}
    ]
  }
}
```

### 获取考试成绩列表（教师）
```http
GET /grades/exam/{exam_id}
Authorization: Bearer {token}
```

### 更新成绩（教师）
```http
PUT /grades/{id}
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "score": 85,
  "comment": "成绩评语"
}
```

### 导出成绩（教师）
```http
GET /grades/export/{exam_id}
Authorization: Bearer {token}
```

## 错误代码

| 状态码 | 错误代码 | 描述 |
|--------|----------|------|
| 400 | INVALID_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 数据冲突 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 429 | RATE_LIMIT | 请求频率限制 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 请求限制

- 登录接口：每分钟最多5次尝试
- 一般接口：每分钟最多100次请求
- 文件上传：单个文件最大10MB

## 数据格式说明

### 日期时间格式
所有日期时间字段使用ISO 8601格式：`2024-01-15T09:00:00Z`

### 文件上传格式
支持的图片格式：jpg, jpeg, png, gif
支持的文档格式：pdf, doc, docx, xls, xlsx

### 分页参数
- `page`: 页码，从1开始
- `limit`: 每页数量，默认10，最大100
- `sort`: 排序字段
- `order`: 排序方向，asc或desc
