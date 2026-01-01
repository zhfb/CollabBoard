import prisma from '../prisma/index.js';

// 创建列表
export const createList = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;
    const { id: userId } = req.user;

    if (!title) {
      return res.status(400).json({ error: '列表标题不能为空' });
    }

    // 验证看板是否存在且属于当前用户
    const board = await prisma.board.findFirst({
      where: {
        id: parseInt(boardId),
        ownerId: userId
      }
    });

    if (!board) {
      return res.status(404).json({ error: '看板不存在或无访问权限' });
    }

    // 获取当前最大order值
    const maxOrder = await prisma.list.aggregate({
      where: {
        boardId: parseInt(boardId)
      },
      _max: {
        order: true
      }
    });

    // 创建新列表，order值为当前最大值+1
    const newOrder = maxOrder._max.order !== null ? maxOrder._max.order + 1 : 0;

    const list = await prisma.list.create({
      data: {
        title,
        order: newOrder,
        boardId: parseInt(boardId)
      },
      select: {
        id: true,
        title: true,
        order: true,
        boardId: true
      }
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: '创建列表失败', details: error.message });
  }
};

// 更新列表
export const updateList = async (req, res) => {
  try {
    const { id: listId } = req.params;
    const { title } = req.body;
    const { id: userId } = req.user;

    if (!title) {
      return res.status(400).json({ error: '列表标题不能为空' });
    }

    // 验证列表是否存在且属于当前用户
    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(listId)
      },
      include: {
        board: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!list || list.board.ownerId !== userId) {
      return res.status(404).json({ error: '列表不存在或无访问权限' });
    }

    const updatedList = await prisma.list.update({
      where: {
        id: parseInt(listId)
      },
      data: {
        title
      },
      select: {
        id: true,
        title: true,
        order: true,
        boardId: true
      }
    });

    res.status(200).json(updatedList);
  } catch (error) {
    res.status(500).json({ error: '更新列表失败', details: error.message });
  }
};

// 删除列表
export const deleteList = async (req, res) => {
  try {
    const { id: listId } = req.params;
    const { id: userId } = req.user;

    // 验证列表是否存在且属于当前用户
    const list = await prisma.list.findFirst({
      where: {
        id: parseInt(listId)
      },
      include: {
        board: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!list || list.board.ownerId !== userId) {
      return res.status(404).json({ error: '列表不存在或无访问权限' });
    }

    await prisma.list.delete({
      where: {
        id: parseInt(listId)
      }
    });

    res.status(200).json({ message: '列表删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除列表失败', details: error.message });
  }
};

// 重排序列表
export const reorderLists = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { listIds } = req.body;
    const { id: userId } = req.user;

    if (!Array.isArray(listIds) || listIds.length === 0) {
      return res.status(400).json({ error: '无效的列表ID数组' });
    }

    // 验证看板是否存在且属于当前用户
    const board = await prisma.board.findFirst({
      where: {
        id: parseInt(boardId),
        ownerId: userId
      }
    });

    if (!board) {
      return res.status(404).json({ error: '看板不存在或无访问权限' });
    }

    // 使用事务更新所有列表的order值
    await prisma.$transaction(
      listIds.map((listId, index) => {
        return prisma.list.update({
          where: {
            id: parseInt(listId),
            boardId: parseInt(boardId)
          },
          data: {
            order: index
          }
        });
      })
    );

    res.status(200).json({ message: '列表重排序成功' });
  } catch (error) {
    res.status(500).json({ error: '列表重排序失败', details: error.message });
  }
};
