const express = require('express');
const { prisma } = require('../index');

const router = express.Router();

// 获取所有看板
router.get('/', async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        lists: {
          include: {
            cards: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取看板失败' });
  }
});

// 获取单个看板详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const board = await prisma.board.findUnique({
      where: { id: parseInt(id) },
      include: {
        lists: {
          include: {
            cards: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: '看板不存在' });
    }

    res.status(200).json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取看板详情失败' });
  }
});

// 创建看板
router.post('/', async (req, res) => {
  try {
    const { title, user_id } = req.body;
    const board = await prisma.board.create({
      data: {
        title,
        user_id
      },
      include: {
        lists: {
          include: {
            cards: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    res.status(201).json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建看板失败' });
  }
});

// 更新看板
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const board = await prisma.board.update({
      where: { id: parseInt(id) },
      data: {
        title
      },
      include: {
        lists: {
          include: {
            cards: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    res.status(200).json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新看板失败' });
  }
});

// 删除看板
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.board.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除看板失败' });
  }
});

module.exports = router;
