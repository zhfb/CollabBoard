// JWT认证中间件
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../prisma/index.js';

dotenv.config();

const auth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '请提供认证token' });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, createdAt: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: '无效的token' });
    }
    
    // 注入用户信息到请求对象
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ error: '认证失败' });
  }
};

export default auth;
