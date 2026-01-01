// Socket.io配置
import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // 监听连接事件
  io.on('connection', (socket) => {
    console.log('新的客户端连接:', socket.id);

    // 监听加入看板房间事件
    socket.on('join_board', (boardId) => {
      console.log(`客户端 ${socket.id} 加入看板房间: ${boardId}`);
      // 离开所有现有房间
      Object.keys(socket.rooms).forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      // 加入新的看板房间
      socket.join(boardId);
      // 发送确认消息
      socket.emit('joined_board', { boardId });
    });

    // 监听断开连接事件
    socket.on('disconnect', () => {
      console.log('客户端断开连接:', socket.id);
    });
  });

  return io;
};

// 事件广播函数
export const emitToBoard = (boardId, event, data) => {
  if (!io) {
    throw new Error('Socket.io未初始化');
  }
  io.to(boardId).emit(event, data);
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io未初始化');
  }
  return io;
};
