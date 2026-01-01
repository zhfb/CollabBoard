const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户看板列表
router.get('/', auth, async (req, res) => {
  const boards = await prisma.board.findMany({
    where: { ownerId: req.user.id },
    include: { lists: { include: { cards: true } } }
  });
  res.json(boards);
});

// 创建看板
router.post('/', auth, async (req, res) => {
  const { title, description, color } = req.body;
  const board = await prisma.board.create({
    data: { title, description, color, ownerId: req.user.id }
  });
  res.json(board);
});

// 获取单个看板详情（包含列表和卡片）
router.get('/:id', auth, async (req, res) => {
  const board = await prisma.board.findUnique({
    where: { id: Number(req.params.id) },
    include: { lists: { include: { cards: true }, orderBy: { order: 'asc' } } }
  });
  if (board.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  res.json(board);
});

// 更新卡片/列表顺序（拖拽核心）
router.patch('/:id/order', auth, async (req, res) => {
  const { lists } = req.body; // [{ id, order, cards: [{ id, order }] }]
  const operations = [];
  for (const list of lists) {
    operations.push(prisma.list.update({
      where: { id: list.id },
      data: { order: list.order }
    }));
    for (const card of list.cards) {
      operations.push(prisma.card.update({
        where: { id: card.id },
        data: { order: card.order, listId: list.id }
      }));
    }
  }
  await prisma.$transaction(operations);
  res.json({ message: 'Order updated' });
});

// 其他CRUD（添加列表、卡片、删除等）类似，可扩展

module.exports = router;