import api from './authService';
import { ApiResponse, User, PaginatedResponse } from '../types';
import { AxiosResponse } from 'axios';

export const userService = {
  // 获取用户列表
  getUsers: (params: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<User>>>> => {
    return api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
  },

  // 创建用户
  createUser: (userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.post<ApiResponse<User>>('/users', userData);
  },

  // 更新用户
  updateUser: (id: number, userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.put<ApiResponse<User>>(`/users/${id}`, userData);
  },

  // 删除用户
  deleteUser: (id: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.delete<ApiResponse>(`/users/${id}`);
  },

  // 获取用户详情
  getUserById: (id: number): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.get<ApiResponse<User>>(`/users/${id}`);
  },

  // 获取教师列表
  getTeachers: (params: { page: number; limit: number }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<User>>>> => {
    return api.get<ApiResponse<PaginatedResponse<User>>>('/users/teachers', { params });
  },

  // 获取学生列表
  getStudents: (params: { page: number; limit: number; class_id?: number }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<User>>>> => {
    return api.get<ApiResponse<PaginatedResponse<User>>>('/users/students', { params });
  },
};
