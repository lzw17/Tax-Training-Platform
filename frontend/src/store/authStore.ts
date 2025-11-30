import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // 登录
      login: async (credentials: LoginRequest) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.login(credentials);
          // 后端返回的是 ApiResponse<LoginResponse> 结构，这里直接通过 AxiosResponse 泛型拿到 data
          const { data } = response.data;

          if (!data) {
            throw new Error('登录响应数据异常');
          }

          const { user, token } = data;
          
          // 设置token到axios默认headers
          authService.setAuthToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || '登录失败'
          });
          throw error;
        }
      },

      // 登出
      logout: () => {
        // 清除token
        authService.clearAuthToken();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 更新用户信息
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData }
          });
        }
      },

      // 检查认证状态
      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          return;
        }

        try {
          set({ loading: true });
          
          // 设置token到axios
          authService.setAuthToken(token);
          
          // 验证token并获取用户信息（后端同样返回 ApiResponse<User>）
          const response = await authService.getProfile();
          const { data } = response.data;

          if (!data) {
            throw new Error('获取用户信息失败');
          }

          const user = data;

          set({
            user,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          // token无效，清除认证状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false
          });
          authService.clearAuthToken();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
