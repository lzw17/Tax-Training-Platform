import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest, User, ApiResponse, PaginatedResponse, RegisterRequest } from '../types';
import { UserService } from '../services/UserService';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class UserController {
  private userService = new UserService();

  // 获取当前用户信息
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const user = await this.userService.findById(req.user.id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<User> = {
      success: true,
      message: '获取用户信息成功',
      data: userWithoutPassword as User
    };

    res.json(response);
  });

  // 更新当前用户信息
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { real_name, phone, avatar } = req.body;
    
    const updatedUser = await this.userService.update(req.user.id, {
      real_name,
      phone,
      avatar
    });

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = updatedUser;

    const response: ApiResponse<User> = {
      success: true,
      message: '更新用户信息成功',
      data: userWithoutPassword as User
    };

    res.json(response);
  });

  // 修改密码
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError('旧密码和新密码不能为空', 400);
    }

    // 获取用户信息
    const user = await this.userService.findById(req.user.id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('旧密码错误', 400);
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await this.userService.updatePassword(req.user.id, hashedPassword);

    const response: ApiResponse = {
      success: true,
      message: '密码修改成功'
    };

    res.json(response);
  });

  // 获取用户列表（管理员）
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, role, status, search, sort, order } = req.query;

    const users = await this.userService.findAll({
      page: Number(page),
      limit: Number(limit),
      role: role as any,
      status: status as string,
      search: search as string,
      sort: sort as string,
      order: order as 'asc' | 'desc'
    });

    // 移除所有用户的密码字段
    const usersWithoutPassword = users.items.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    const response: ApiResponse<PaginatedResponse<Partial<User>>> = {
      success: true,
      message: '获取用户列表成功',
      data: {
        ...users,
        items: usersWithoutPassword
      }
    };

    res.json(response);
  });

  // 获取教师列表
  getTeachers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, sort, order } = req.query;

    const teachers = await this.userService.findTeachers({
      page: Number(page),
      limit: Number(limit),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    });

    // 移除密码字段
    const teachersWithoutPassword = teachers.items.map(teacher => {
      const { password: _, ...teacherWithoutPassword } = teacher;
      return teacherWithoutPassword;
    });

    const response: ApiResponse<PaginatedResponse<Partial<User>>> = {
      success: true,
      message: '获取教师列表成功',
      data: {
        ...teachers,
        items: teachersWithoutPassword
      }
    };

    res.json(response);
  });

  // 获取学生列表
  getStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, class_id, sort, order } = req.query;

    const students = await this.userService.findStudents({
      page: Number(page),
      limit: Number(limit),
      class_id: class_id ? Number(class_id) : undefined,
      sort: sort as string,
      order: order as 'asc' | 'desc'
    });

    // 移除密码字段
    const studentsWithoutPassword = students.items.map(student => {
      const { password: _, ...studentWithoutPassword } = student;
      return studentWithoutPassword;
    });

    const response: ApiResponse<PaginatedResponse<Partial<User>>> = {
      success: true,
      message: '获取学生列表成功',
      data: {
        ...students,
        items: studentsWithoutPassword
      }
    };

    res.json(response);
  });

  // 创建用户（管理员）
  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
      message: '创建用户成功',
      data: userWithoutPassword as User
    };

    res.status(201).json(response);
  });

  // 获取用户详情
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的用户ID', 400);
    }

    const user = await this.userService.findById(Number(id));
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<User> = {
      success: true,
      message: '获取用户详情成功',
      data: userWithoutPassword as User
    };

    res.json(response);
  });

  // 更新用户信息（管理员）
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userData = req.body;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的用户ID', 400);
    }

    const userId = Number(id);

    // 检查用户是否存在
    const existingUser = await this.userService.findById(userId);
    if (!existingUser) {
      throw new AppError('用户不存在', 404);
    }

    // 如果要更新邮箱，检查是否已被其他用户使用
    if (userData.email && userData.email !== existingUser.email) {
      const emailUser = await this.userService.findByEmail(userData.email);
      if (emailUser && emailUser.id !== userId) {
        throw new AppError('邮箱已被其他用户使用', 409);
      }
    }

    const updatedUser = await this.userService.update(userId, userData);

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = updatedUser;

    const response: ApiResponse<User> = {
      success: true,
      message: '更新用户信息成功',
      data: userWithoutPassword as User
    };

    res.json(response);
  });

  // 删除用户（管理员）
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的用户ID', 400);
    }

    const userId = Number(id);

    // 检查用户是否存在
    const existingUser = await this.userService.findById(userId);
    if (!existingUser) {
      throw new AppError('用户不存在', 404);
    }

    // 不允许删除管理员账户
    if (existingUser.role === 'admin') {
      throw new AppError('不能删除管理员账户', 403);
    }

    await this.userService.delete(userId);

    const response: ApiResponse = {
      success: true,
      message: '删除用户成功'
    };

    res.json(response);
  });
}
