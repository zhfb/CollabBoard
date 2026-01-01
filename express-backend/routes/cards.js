const express = require('express');
const { prisma, io } = require('../index');

const router = express.Router();

// 创建卡片
router.post('/', async (req, res) => {
  try {
    const { title, description, list_id, order, due_date } = req.body;
    const card = await prisma.card.create({
      data: {
        title,
        description,
        list_id,
        order,
        due_date: due_date ? new Date(due_date) : null
      }
    });
    res.status(201).json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建卡片失败' });
  }
});

// 更新卡片
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, list_id, order, due_date } = req.body;
    
    // 更新卡片
    const card = await prisma.card.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        list_id,
        order,
        due_date: due_date ? new Date(due_date) : null
      }
    });
    
    // 如果卡片移动到了新列表或者顺序改变，广播事件
    if (list_id || order) {
      io.emit('card:moved', {
        card_id: card.id,
        list_id: card.list_id,
        order: card.order
      });
    }
    
    res.status(200).json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新卡片失败' });
  }
});

// 删除卡片
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.card.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除卡片失败' });
  }
});

// 更新卡片顺序（批量）
router.put('/batch/update-order', async (req, res) => {
  try {
    const { cards } = req.body;
    
    // 批量更新卡片顺序
    const updatedCards = await Promise.all(
      cards.map((card) => 
        prisma.card.update({
          where: { id: card.id },
          data: {
            order: card.order,
            list_id: card.list_id
          }
        })
      )
    );
    
    // 广播卡片移动事件
    updatedCards.forEach(card => {
      io.emit('card:moved', {
        card_id: card.id,
        list_id: card.list_id,
        order: card.order
      });
    });
    
    res.status(200).json(updatedCards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新卡片顺序失败' });
  }
});

module.exports = router;
