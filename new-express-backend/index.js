// 主入口文件
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import healthRoutes from './src/routes/healthRoutes.js';
import boardRoutes from './src/routes/boardRoutes.js';
import listRoutes from './src/routes/listRoutes.js';
import cardRoutes from './src/routes/cardRoutes.js';
import { initSocket } from './src/socket/index.js';
import scanExpiredCards from './src/utils/cron.js';
import prisma from './src/prisma/index.js';

dotenv.config();

// 创建Express应用
const app = express();

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化Socket.io
initSocket(server);

// 配置中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件服务
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 提供前端构建的静态文件
app.use(express.static(path.join(__dirname, '../vue3-template/dist')));

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api', healthRoutes);

// 根路由 - 返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../vue3-template/dist/index.html'));
});

// 处理404
app.use((req, res) => {
  res.status(404).json({ error: '请求的资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3003;

// 检查数据库连接
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');
    // 启动过期卡片扫描任务
    // scanExpiredCards();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
}

server.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API 路由已配置完成，包括权限控制中间件');
  
  // 检查数据库连接
  await checkDatabaseConnection();
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
