import axios, { AxiosResponse } from 'axios';
import { LoginRequest, RegisterRequest, ApiResponse, User, LoginResponse } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误，清除token并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // 登录
  login: (credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> => {
    return api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
  },

  // 注册
  register: (userData: RegisterRequest): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.post<ApiResponse<User>>('/auth/register', userData);
  },

  // 登出
  logout: (): Promise<AxiosResponse<ApiResponse>> => {
    return api.post<ApiResponse>('/auth/logout');
  },

  // 获取用户信息
  getProfile: (): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.get<ApiResponse<User>>('/users/profile');
  },

  // 更新用户信息
  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.put<ApiResponse<User>>('/users/profile', userData);
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<AxiosResponse<ApiResponse>> => {
    return api.put<ApiResponse>('/users/password', data);
  },

  // 忘记密码
  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.post<ApiResponse>('/auth/forgot-password', { email });
  },

  // 重置密码
  resetPassword: (data: { token: string; password: string }): Promise<AxiosResponse<ApiResponse>> => {
    return api.post<ApiResponse>('/auth/reset-password', data);
  },

  // 刷新token
  refreshToken: (): Promise<AxiosResponse<ApiResponse<{ token: string }>>> => {
    return api.post<ApiResponse<{ token: string }>>('/auth/refresh');
  },

  // 设置认证token
  setAuthToken: (token: string) => {
    localStorage.setItem('auth-token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // 清除认证token
  clearAuthToken: () => {
    localStorage.removeItem('auth-token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
