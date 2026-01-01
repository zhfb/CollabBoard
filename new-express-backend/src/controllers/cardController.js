import prisma from '../prisma/index.js';
import { emitToBoard } from '../socket/index.js';

// 创建卡片
export const createCard = async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: '卡片标题不能为空' });
    }

    // 验证列表是否存在
    const list = await prisma.list.findUnique({
      where: {
        id: parseInt(listId)
      }
    });

    if (!list) {
      return res.status(404).json({ error: '列表不存在' });
    }

    // 获取当前列表中最大order值
    const maxOrder = await prisma.card.aggregate({
      where: {
        listId: parseInt(listId)
      },
      _max: {
        order: true
      }
    });

    // 创建新卡片，order值为当前最大值+1
    const newOrder = maxOrder._max.order !== null ? maxOrder._max.order + 1 : 0;

    const card = await prisma.card.create({
      data: {
        title,
        description,
        dueDate,
        order: newOrder,
        listId: parseInt(listId)
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        dueDate: true,
        listId: true
      }
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: '创建卡片失败', details: error.message });
  }
};

// 更新卡片
export const updateCard = async (req, res) => {
  try {
    const { id: cardId } = req.params;
    const { title, description, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: '卡片标题不能为空' });
    }

    // 验证卡片是否存在
    const card = await prisma.card.findUnique({
      where: {
        id: parseInt(cardId)
      }
    });

    if (!card) {
      return res.status(404).json({ error: '卡片不存在' });
    }

    const updatedCard = await prisma.card.update({
      where: {
        id: parseInt(cardId)
      },
      data: {
        title,
        description,
        dueDate
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        dueDate: true,
        listId: true
      }
    });

    res.status(200).json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: '更新卡片失败', details: error.message });
  }
};

// 删除卡片
export const deleteCard = async (req, res) => {
  try {
    const { id: cardId } = req.params;

    // 验证卡片是否存在
    const card = await prisma.card.findUnique({
      where: {
        id: parseInt(cardId)
      }
    });

    if (!card) {
      return res.status(404).json({ error: '卡片不存在' });
    }

    await prisma.card.delete({
      where: {
        id: parseInt(cardId)
      }
    });

    res.status(200).json({ message: '卡片删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除卡片失败', details: error.message });
  }
};

// 移动卡片（同一列表内排序或跨列表移动）
export const moveCard = async (req, res) => {
  try {
    const { id: cardId } = req.params;
    const { targetListId, targetOrder } = req.body;

    if (!targetListId || targetOrder === undefined) {
      return res.status(400).json({ error: '缺少目标列表ID或目标排序值' });
    }

    // 使用事务确保并发安全
    let boardId;
    const result = await prisma.$transaction(async (tx) => {
      // 1. 获取当前卡片信息
      const card = await tx.card.findFirst({
        where: {
          id: parseInt(cardId)
        },
        include: {
          list: {
            include: {
              board: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });
      
      // 保存boardId
      boardId = card.list.board.id;

      if (!card) {
        throw new Error('卡片不存在');
      }

      // 2. 验证目标列表是否存在
      const targetList = await tx.list.findFirst({
        where: {
          id: parseInt(targetListId)
        }
      });

      if (!targetList) {
        throw new Error('目标列表不存在');
      }

      // 3. 如果是跨列表移动
      if (card.listId !== parseInt(targetListId)) {
        // 3.1 原列表：更新所有order大于当前卡片order的卡片，order减1
        await tx.card.updateMany({
          where: {
            listId: card.listId,
            order: {
              gt: card.order
            }
          },
          data: {
            order: {
              decrement: 1
            }
          }
        });

        // 3.2 目标列表：更新所有order大于等于目标order的卡片，order加1
        await tx.card.updateMany({
          where: {
            listId: parseInt(targetListId),
            order: {
              gte: parseInt(targetOrder)
            }
          },
          data: {
            order: {
              increment: 1
            }
          }
        });

        // 3.3 更新卡片的listId和order
        const updatedCard = await tx.card.update({
          where: {
            id: parseInt(cardId)
          },
          data: {
            listId: parseInt(targetListId),
            order: parseInt(targetOrder)
          },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            dueDate: true,
            listId: true
          }
        });

        return updatedCard;
      } else {
        // 4. 如果是同一列表内移动
        if (card.order < parseInt(targetOrder)) {
          // 4.1 从低位置移动到高位置：更新所有order在原位置和目标位置之间的卡片，order减1
          await tx.card.updateMany({
            where: {
              listId: card.listId,
              order: {
                gt: card.order,
                lte: parseInt(targetOrder)
              }
            },
            data: {
              order: {
                decrement: 1
              }
            }
          });
        } else if (card.order > parseInt(targetOrder)) {
          // 4.2 从高位置移动到低位置：更新所有order在目标位置和原位置之间的卡片，order加1
          await tx.card.updateMany({
            where: {
              listId: card.listId,
              order: {
                gte: parseInt(targetOrder),
                lt: card.order
              }
            },
            data: {
              order: {
                increment: 1
              }
            }
          });
        }

        // 4.3 更新卡片的order
        const updatedCard = await tx.card.update({
          where: {
            id: parseInt(cardId)
          },
          data: {
            order: parseInt(targetOrder)
          },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            dueDate: true,
            listId: true
          }
        });

        return updatedCard;
      }
    });

    // 广播卡片更新事件给所有在同一看板的用户
    if (boardId) {
      emitToBoard(boardId, 'card:updated', {
        card: result,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: '移动卡片失败', details: error.message });
  }
};
