import api from './authService';
import { ApiResponse, Exam, ExamRecord, PaginatedResponse, ExamStatus } from '../types';
import { AxiosResponse } from 'axios';

export const examService = {
  // 获取考试列表
  getExams: (params: {
    page: number;
    limit: number;
    course_id?: number;
    status?: ExamStatus;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Exam>>>> => {
    return api.get<ApiResponse<PaginatedResponse<Exam>>>('/exams', { params });
  },

  // 创建考试
  createExam: (examData: Partial<Exam>): Promise<AxiosResponse<ApiResponse<Exam>>> => {
    return api.post<ApiResponse<Exam>>('/exams', examData);
  },

  // 更新考试
  updateExam: (id: number, examData: Partial<Exam>): Promise<AxiosResponse<ApiResponse<Exam>>> => {
    return api.put<ApiResponse<Exam>>(`/exams/${id}`, examData);
  },

  // 删除考试
  deleteExam: (id: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.delete<ApiResponse>(`/exams/${id}`);
  },

  // 获取考试详情
  getExamById: (id: number): Promise<AxiosResponse<ApiResponse<Exam>>> => {
    return api.get<ApiResponse<Exam>>(`/exams/${id}`);
  },

  // 获取考试题目
  getExamQuestions: (examId: number): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    return api.get<ApiResponse<any[]>>(`/exams/${examId}/questions`);
  },

  // 添加题目到考试
  addQuestion: (examId: number, questionId: number, score: number, order: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.post<ApiResponse>(`/exams/${examId}/questions`, { question_id: questionId, score, order });
  },

  // 移除考试题目
  removeQuestion: (examId: number, questionId: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.delete<ApiResponse>(`/exams/${examId}/questions/${questionId}`);
  },

  // 开始考试
  startExam: (examId: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    // 后端通常会返回考试记录和题目列表，例如：{ record_id, questions }
    return api.post<ApiResponse<any>>(`/exams/${examId}/start`);
  },

  // 提交考试答案
  submitExam: (recordId: number, payload: any): Promise<AxiosResponse<ApiResponse<any>>> => {
    // 与 ExamTaking.tsx 中的调用保持一致：submitExam(recordId, { answers })
    return api.post<ApiResponse<any>>(`/exams/${recordId}/submit`, payload);
  },

  // 获取学生考试记录
  getStudentRecord: (examId: number): Promise<AxiosResponse<ApiResponse<ExamRecord>>> => {
    return api.get<ApiResponse<ExamRecord>>(`/exams/${examId}/record`);
  },

  // 获取考试统计
  getExamStats: (examId: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get<ApiResponse<any>>(`/exams/${examId}/stats`);
  },
};
