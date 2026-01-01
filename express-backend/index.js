const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// 加载环境变量
dotenv.config();

// 创建Prisma客户端
const prisma = new PrismaClient();

// 创建Express应用
const app = express();

// 配置中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 创建HTTP服务器
const server = http.createServer(app);

// 创建Socket.io服务器
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 导出Socket.io实例供路由使用
module.exports = { io, prisma };

// 导入路由
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

// Socket.io事件处理
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 监听卡片移动事件
  socket.on('card:moved', (data) => {
    console.log('Card moved:', data);
    // 广播卡片移动事件给所有连接的客户端
    io.emit('card:moved', data);
  });

  // 监听列表移动事件
  socket.on('list:moved', (data) => {
    console.log('List moved:', data);
    // 广播列表移动事件给所有连接的客户端
    io.emit('list:moved', data);
  });

  // 监听连接断开
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
