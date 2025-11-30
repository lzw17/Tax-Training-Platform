import api from './authService';
import { ApiResponse, Course, PaginatedResponse } from '../types';
import { AxiosResponse } from 'axios';

export const courseService = {
  // 获取课程列表
  getCourses: (params: {
    page: number;
    limit: number;
    teacher_id?: number;
    status?: string;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Course>>>> => {
    return api.get<ApiResponse<PaginatedResponse<Course>>>('/courses', { params });
  },

  // 创建课程
  createCourse: (courseData: Partial<Course>): Promise<AxiosResponse<ApiResponse<Course>>> => {
    return api.post<ApiResponse<Course>>('/courses', courseData);
  },

  // 更新课程
  updateCourse: (id: number, courseData: Partial<Course>): Promise<AxiosResponse<ApiResponse<Course>>> => {
    return api.put<ApiResponse<Course>>(`/courses/${id}`, courseData);
  },

  // 删除课程
  deleteCourse: (id: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.delete<ApiResponse>(`/courses/${id}`);
  },

  // 获取课程详情
  getCourseById: (id: number): Promise<AxiosResponse<ApiResponse<Course>>> => {
    return api.get<ApiResponse<Course>>(`/courses/${id}`);
  },

  // 学生选课
  enrollCourse: (courseId: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.post<ApiResponse>(`/courses/${courseId}/enroll`);
  },

  // 学生退课
  unenrollCourse: (courseId: number): Promise<AxiosResponse<ApiResponse>> => {
    return api.post<ApiResponse>(`/courses/${courseId}/unenroll`);
  },

  // 获取课程学生列表
  getCourseStudents: (courseId: number, params: { page: number; limit: number }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get<ApiResponse<PaginatedResponse<any>>>(`/courses/${courseId}/students`, { params });
  },
};
