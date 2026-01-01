const express = require('express');
const { prisma, io } = require('../index');

const router = express.Router();

// 创建列表
router.post('/', async (req, res) => {
  try {
    const { title, board_id, order } = req.body;
    const list = await prisma.list.create({
      data: {
        title,
        board_id,
        order
      },
      include: {
        cards: {
          orderBy: { order: 'asc' }
        }
      }
    });
    res.status(201).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建列表失败' });
  }
});

// 更新列表
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;
    const list = await prisma.list.update({
      where: { id: parseInt(id) },
      data: {
        title,
        order
      },
      include: {
        cards: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    // 如果列表顺序改变，广播事件
    if (order !== undefined) {
      io.emit('list:moved', {
        list_id: list.id,
        board_id: list.board_id,
        order: list.order
      });
    }
    
    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新列表失败' });
  }
});

// 删除列表
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.list.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除列表失败' });
  }
});

module.exports = router;
