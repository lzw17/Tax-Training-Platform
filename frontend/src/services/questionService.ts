import api from './authService';
import { ApiResponse, Question, PaginatedResponse, QuestionType } from '../types';
import { AxiosResponse } from 'axios';

export const questionService = {
  // 获取试题列表
  getQuestions: (params: {
    page: number;
    limit: number;
    type?: QuestionType;
    category?: string;
    difficulty?: number;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Question>>>> => {
    return api.get<ApiResponse<PaginatedResponse<Question>>>('/questions', { params });
  },

  // 创建试题
  createQuestion: (questionData: Partial<Question>): Promise<AxiosResponse<ApiResponse<Question>>> => {
    return api.post<ApiResponse<Question>>('/questions', questionData);
  },

  // 更新试题
  updateQuestion: (id: number, questionData: Partial<Question>): Promise<AxiosResponse<ApiResponse<Question>>> => {
    return api.put<ApiResponse<Question>>(`/questions/${id}`, questionData);
  },

  // 删除试题
  deleteQuestion: (id: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.delete<ApiResponse>(`/questions/${id}`);
  },

  // 获取试题详情
  getQuestionById: (id: number): Promise<AxiosResponse<ApiResponse<Question>>> => {
    return api.get<ApiResponse<Question>>(`/questions/${id}`);
  },

  // 获取试题分类
  getCategories: (): Promise<AxiosResponse<ApiResponse<string[]>>> => {
    return api.get<ApiResponse<string[]>>('/questions/categories');
  },

  // 批量导入试题
  batchImport: (questions: Partial<Question>[]): Promise<AxiosResponse<ApiResponse<{ success_count: number }>>> => {
    return api.post<ApiResponse<{ success_count: number }>>('/questions/batch-import', { questions });
  },

  // 导出试题
  exportQuestions: (params: { type?: QuestionType; category?: string }): Promise<AxiosResponse<Blob>> => {
    return api.get('/questions/export', { params, responseType: 'blob' });
  },
};
