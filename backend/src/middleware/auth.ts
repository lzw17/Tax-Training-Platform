import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload, UserRole } from '../types';
import { AppError } from './errorHandler';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未提供认证令牌', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('JWT密钥未配置', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('无效的认证令牌', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('认证令牌已过期', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('用户未认证', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('权限不足', 403));
    }

    next();
  };
};

// 检查是否为管理员
export const requireAdmin = authorize(UserRole.ADMIN);

// 检查是否为教师或管理员
export const requireTeacher = authorize(UserRole.ADMIN, UserRole.TEACHER);

// 检查是否为学生、教师或管理员
export const requireUser = authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT);
