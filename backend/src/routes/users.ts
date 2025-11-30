import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const userController = new UserController();

// 获取当前用户信息
router.get('/profile', authenticate, asyncHandler(userController.getProfile));

// 更新当前用户信息
router.put('/profile', authenticate, asyncHandler(userController.updateProfile));

// 修改密码
router.put('/password', authenticate, asyncHandler(userController.changePassword));

// 获取用户列表（管理员）
router.get('/', authenticate, requireAdmin, asyncHandler(userController.getUsers));

// 获取教师列表
router.get('/teachers', authenticate, requireTeacher, asyncHandler(userController.getTeachers));

// 获取学生列表
router.get('/students', authenticate, requireTeacher, asyncHandler(userController.getStudents));

// 创建用户（管理员）
router.post('/', authenticate, requireAdmin, asyncHandler(userController.createUser));

// 获取用户详情
router.get('/:id', authenticate, requireTeacher, asyncHandler(userController.getUserById));

// 更新用户信息（管理员）
router.put('/:id', authenticate, requireAdmin, asyncHandler(userController.updateUser));

// 删除用户（管理员）
router.delete('/:id', authenticate, requireAdmin, asyncHandler(userController.deleteUser));

export default router;
