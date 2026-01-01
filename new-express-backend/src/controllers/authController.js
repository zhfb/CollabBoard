// 认证控制器
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../prisma/index.js';

dotenv.config();

// 注册新用户
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: '邮箱已存在' });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword
      },
      select: { id: true, username: true, email: true, createdAt: true }
    });
    
    // 生成token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 用户登录
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 生成token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    // 返回用户信息（不包含密码）和token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    // req.user已经通过auth中间件注入
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
};
