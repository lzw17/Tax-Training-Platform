import api from './authService';
import { ApiResponse, PaginatedResponse } from '../types';
import { AxiosResponse } from 'axios';

export const gradeService = {
  // 获取所有成绩列表（管理员/教师）
  getGrades: (params: {
    page: number;
    limit: number;
    search?: string;
    course_id?: number;
    exam_id?: number;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get<ApiResponse<PaginatedResponse<any>>>('/grades', { params });
  },

  // 获取学生成绩列表
  getStudentGrades: (studentId: number): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    return api.get<ApiResponse<any[]>>(`/grades/student/${studentId}`);
  },

  // 获取考试成绩列表
  getExamGrades: (examId: number, params: { page: number; limit: number }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get<ApiResponse<PaginatedResponse<any>>>(`/grades/exam/${examId}`, { params });
  },

  // 获取课程成绩统计
  getCourseStats: (courseId: number): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    return api.get<ApiResponse<any[]>>(`/grades/course/${courseId}/stats`);
  },

  // 获取学生成绩统计
  getStudentStats: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get<ApiResponse<any>>('/grades/student/stats');
  },

  // 获取成绩分布
  getScoreDistribution: (examId: number): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    return api.get<ApiResponse<any[]>>(`/grades/exam/${examId}/distribution`);
  },

  // 更新成绩
  updateGrade: (recordId: number, score: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.put<ApiResponse>(`/grades/${recordId}`, { score });
  },

  // 导出成绩
  exportGrades: (examId: number): Promise<AxiosResponse<Blob>> => {
    return api.get(`/grades/exam/${examId}/export`, { responseType: 'blob' });
  },
};
