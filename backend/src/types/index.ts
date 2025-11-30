import { Request } from 'express';

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 考试状态枚举
export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  ESSAY = 'essay'
}

// 基础用户信息
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  real_name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

// 教师信息
export interface Teacher extends Omit<User, 'role'> {
  role: UserRole.TEACHER;
  employee_id: string;
  department: string;
  title: string;
  bio?: string;
}

// 学生信息
export interface Student extends Omit<User, 'role'> {
  role: UserRole.STUDENT;
  student_id: string;
  class_id: number;
  grade: string;
  major: string;
  enrollment_year: number;
}

// 班级信息
export interface Class {
  id: number;
  name: string;
  grade: string;
  major: string;
  teacher_id: number;
  student_count: number;
  created_at: Date;
  updated_at: Date;
}

// 课程信息
export interface Course {
  id: number;
  name: string;
  description: string;
  teacher_id: number;
  cover_image?: string;
  credit_hours: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

// 试题信息
export interface Question {
  id: number;
  title: string;
  content: string;
  type: QuestionType;
  options?: string; // JSON字符串
  correct_answer: string;
  explanation?: string;
  difficulty: number; // 1-5
  category: string;
  tags?: string;
  creator_id: number;
  created_at: Date;
  updated_at: Date;
}

// 考试信息
export interface Exam {
  id: number;
  title: string;
  description: string;
  course_id: number;
  creator_id: number;
  start_time: Date;
  end_time: Date;
  duration: number; // 分钟
  total_score: number;
  pass_score: number;
  status: ExamStatus;
  settings: string; // JSON字符串
  created_at: Date;
  updated_at: Date;
}

// 考试题目关联
export interface ExamQuestion {
  id: number;
  exam_id: number;
  question_id: number;
  score: number;
  order: number;
}

// 学生考试记录
export interface ExamRecord {
  id: number;
  exam_id: number;
  student_id: number;
  start_time: Date;
  submit_time?: Date;
  score?: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  answers: string; // JSON字符串
  created_at: Date;
  updated_at: Date;
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 扩展的Request接口，包含用户信息
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
    email: string;
  };
}

// JWT载荷
export interface JwtPayload {
  id: number;
  username: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  user: User;
  token: string;
  expires_in: number;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  real_name: string;
  role: UserRole;
  phone?: string;
}

// 文件上传响应
export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  url: string;
}
