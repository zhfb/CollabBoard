module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 加入看板房间
    socket.on('joinBoard', (boardId) => {
      socket.join(`board-${boardId}`);
      console.log(`User ${socket.id} joined board ${boardId}`);
    });

    // 拖拽同步
    socket.on('cardMoved', ({ boardId, lists }) => {
      socket.to(`board-${boardId}`).emit('cardMoved', lists);
    });

    // 添加/删除/更新同步
    socket.on('listAdded', ({ boardId, list }) => {
      socket.to(`board-${boardId}`).emit('listAdded', list);
    });

    socket.on('cardAdded', ({ boardId, card }) => {
      socket.to(`board-${boardId}`).emit('cardAdded', card);
    });

    // 其他事件类似...

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};