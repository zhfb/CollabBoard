const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./src/routes/authRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 配置Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 配置中间件
app.use(cors());
app.use(express.json());

// 配置路由
app.use('/api/auth', authRoutes);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404路由
app.use((req, res) => {
  res.status(404).json({ message: '路由不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

// Socket.io事件处理
io.on('connection', (socket) => {
  console.log('新客户端连接:', socket.id);

  // 监听客户端断开连接事件
  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id);
  });

  // 监听自定义事件
  socket.on('board:update', (data) => {
    console.log('看板更新:', data);
    // 广播给所有客户端
    io.emit('board:updated', data);
  });

  socket.on('card:update', (data) => {
    console.log('卡片更新:', data);
    // 广播给所有客户端
    io.emit('card:updated', data);
  });
});

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`Socket.io服务器运行在 ws://localhost:${PORT}`);
});
