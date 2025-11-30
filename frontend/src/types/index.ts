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
  real_name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

// 课程信息
export interface Course {
  id: number;
  name: string;
  description: string;
  teacher_id: number;
  teacher_name?: string;
  cover_image?: string;
  credit_hours: number;
  status: 'active' | 'inactive';
  student_count?: number;
  created_at: string;
  updated_at: string;
}

// 试题信息
export interface Question {
  id: number;
  title: string;
  content: string;
  type: QuestionType;
  options?: QuestionOption[];
  correct_answer: string;
  explanation?: string;
  difficulty: number;
  category: string;
  tags?: string[];
  creator_id: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

// 题目选项
export interface QuestionOption {
  key: string;
  value: string;
}

// 考试信息
export interface Exam {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_name?: string;
  creator_id: number;
  creator_name?: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_score: number;
  pass_score: number;
  status: ExamStatus;
  settings: ExamSettings;
  question_count?: number;
  participant_count?: number;
  created_at: string;
  updated_at: string;
}

// 考试设置
export interface ExamSettings {
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result_immediately?: boolean;
  allow_review?: boolean;
  auto_submit?: boolean;
  camera_monitoring?: boolean;
}

// 考试题目关联
export interface ExamQuestion {
  id: number;
  exam_id: number;
  question_id: number;
  question?: Question;
  score: number;
  order: number;
}

// 学生考试记录
export interface ExamRecord {
  id: number;
  exam_id: number;
  exam?: Exam;
  student_id: number;
  student?: Student;
  start_time?: string;
  submit_time?: string;
  score?: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  answers: ExamAnswer[];
  created_at: string;
  updated_at: string;
}

// 考试答案
export interface ExamAnswer {
  question_id: number;
  answer: string | string[];
  is_correct?: boolean;
  score?: number;
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
  search?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// 统计数据
export interface DashboardStats {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_courses: number;
  total_exams: number;
  total_questions: number;
  active_exams: number;
  recent_activities: Activity[];
}

// 活动记录
export interface Activity {
  id: number;
  type: string;
  description: string;
  user_name: string;
  created_at: string;
}

// 成绩统计
export interface GradeStats {
  exam_id: number;
  exam_title: string;
  total_participants: number;
  average_score: number;
  pass_rate: number;
  score_distribution: ScoreDistribution[];
}

// 分数分布
export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

// 文件上传响应
export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  url: string;
}

// 表单验证规则
export interface FormRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (rule: any, value: any) => Promise<void>;
}

// 表格列配置
export interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  sorter?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}
