import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authController = new AuthController();

// 用户登录
router.post('/login', asyncHandler(authController.login));

// 用户注册
router.post('/register', asyncHandler(authController.register));

// 刷新令牌
router.post('/refresh', asyncHandler(authController.refreshToken));

// 用户登出
router.post('/logout', asyncHandler(authController.logout));

// 忘记密码
router.post('/forgot-password', asyncHandler(authController.forgotPassword));

// 重置密码
router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;
