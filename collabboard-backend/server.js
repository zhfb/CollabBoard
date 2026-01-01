const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const boardSocket = require('./sockets/boardSocket');
const { PrismaClient } = require('@prisma/client');

// 创建Prisma客户端
const prisma = new PrismaClient();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 前端域名，生产环境改成具体
    methods: ["GET", "POST"]
  }
});

boardSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`CollabBoard backend running on port ${PORT}`);
});

// 关闭服务器时断开Prisma连接
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});