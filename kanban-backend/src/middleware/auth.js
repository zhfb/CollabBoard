const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT认证中间件
const auth = (req, res, next) => {
  try {
    // 从请求头获取Authorization令牌
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    // 提取令牌（Bearer token格式）
    const token = authHeader.replace('Bearer ', '');
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({ message: '无效的认证令牌' });
  }
};

module.exports = auth;
