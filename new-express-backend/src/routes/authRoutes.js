// 认证路由
import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// 注册路由
router.post('/register', register);

// 登录路由
router.post('/login', login);

// 获取当前用户信息路由（需要认证）
router.get('/me', auth, getCurrentUser);

export default router;
