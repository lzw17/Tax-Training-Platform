import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import CourseManagement from './pages/CourseManagement';
import QuestionManagement from './pages/QuestionManagement';
import ExamManagement from './pages/ExamManagement';
import GradeManagement from './pages/GradeManagement';
import Profile from './pages/Profile';
import ExamTaking from './pages/ExamTaking';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公开路由组件（已登录用户重定向到仪表板）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* 受保护的路由 */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="questions" element={<QuestionManagement />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="grades" element={<GradeManagement />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 考试页面（独立布局） */}
      <Route 
        path="/exam/:examId" 
        element={
          <ProtectedRoute>
            <ExamTaking />
          </ProtectedRoute>
        } 
      />

      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
