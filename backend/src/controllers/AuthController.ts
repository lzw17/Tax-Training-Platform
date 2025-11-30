import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, LoginRequest, RegisterRequest, User, ApiResponse, LoginResponse } from '../types';
import { UserService } from '../services/UserService';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  private userService = new UserService();

  // 用户登录
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, password }: LoginRequest = req.body;

    // 验证输入
    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }

    // 查找用户
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new AppError('账户已被禁用，请联系管理员', 403);
    }

    // 生成JWT token
    const token = this.generateToken(user);

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<LoginResponse> = {
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword as User,
        token,
        expires_in: 24 * 60 * 60 // 24小时
      }
    };

    res.json(response);
  });

  // 用户注册
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: RegisterRequest = req.body;

    // 验证输入
    if (!userData.username || !userData.email || !userData.password || !userData.real_name) {
      throw new AppError('必填字段不能为空', 400);
    }

    // 检查用户名是否已存在
    const existingUser = await this.userService.findByUsername(userData.username);
    if (existingUser) {
      throw new AppError('用户名已存在', 409);
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userService.findByEmail(userData.email);
    if (existingEmail) {
      throw new AppError('邮箱已被使用', 409);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 创建用户
    const newUser = await this.userService.create({
      ...userData,
      password: hashedPassword
    });

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = newUser;

    const response: ApiResponse<User> = {
      success: true,
      message: '注册成功',
      data: userWithoutPassword as User
    };

    res.status(201).json(response);
  });

  // 刷新token
  refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    // 获取最新用户信息
    const user = await this.userService.findById(req.user.id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    // 生成新token
    const token = this.generateToken(user);

    const response: ApiResponse<{ token: string }> = {
      success: true,
      message: 'Token刷新成功',
      data: { token }
    };

    res.json(response);
  });

  // 用户登出
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 在实际应用中，可以将token加入黑名单
    // 这里简单返回成功消息
    const response: ApiResponse = {
      success: true,
      message: '登出成功'
    };

    res.json(response);
  });

  // 忘记密码
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      throw new AppError('邮箱不能为空', 400);
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      // 为了安全，不透露用户是否存在
      const response: ApiResponse = {
        success: true,
        message: '如果邮箱存在，重置密码链接已发送'
      };
      res.json(response);
      return;
    }

    // TODO: 实现邮件发送功能
    // 生成重置token并发送邮件

    const response: ApiResponse = {
      success: true,
      message: '重置密码链接已发送到您的邮箱'
    };

    res.json(response);
  });

  // 重置密码
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError('重置token和新密码不能为空', 400);
    }

    // TODO: 验证重置token
    // 在实际应用中，需要验证token的有效性

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // TODO: 更新用户密码
    // await this.userService.updatePassword(userId, hashedPassword);

    const response: ApiResponse = {
      success: true,
      message: '密码重置成功'
    };

    res.json(response);
  });

  // 生成JWT token
  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT密钥未配置', 500);
    }

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    });
  }
}
