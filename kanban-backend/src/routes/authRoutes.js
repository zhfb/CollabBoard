const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// 注册路由
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6个字符'),
  ],
  authController.register
);

// 登录路由
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  authController.login
);

// 获取当前用户信息路由
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
