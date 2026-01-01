import prisma from '../prisma/index.js';

// 创建看板
export const createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const { id: userId } = req.user;

    if (!title) {
      return res.status(400).json({ error: '看板标题不能为空' });
    }

    const board = await prisma.board.create({
      data: {
        title,
        ownerId: userId
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        ownerId: true
      }
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: '创建看板失败', details: error.message });
  }
};

// 获取用户的所有看板（包括加入的看板）
export const getBoards = async (req, res) => {
  try {
    const { id: userId } = req.user;

    // 获取用户创建的看板
    const ownedBoards = await prisma.board.findMany({
      where: {
        ownerId: userId
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });

    // 获取用户加入的看板
    const joinedBoards = await prisma.boardMember.findMany({
      where: {
        userId
      },
      select: {
        board: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        }
      }
    });

    // 合并并去重
    const allBoards = [...ownedBoards, ...joinedBoards.map(item => item.board)];
    const uniqueBoards = Array.from(new Map(allBoards.map(board => [board.id, board])).values());

    // 按创建时间排序
    uniqueBoards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(uniqueBoards);
  } catch (error) {
    res.status(500).json({ error: '获取看板列表失败', details: error.message });
  }
};

// 获取单个看板详情
export const getBoardById = async (req, res) => {
  try {
    const { id: boardId } = req.params;
    
    // 权限检查已由中间件完成，直接获取看板详情
    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(boardId)
      },
      include: {
        lists: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                dueDate: true,
                listId: true
              }
            }
          }
        },
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: '看板不存在' });
    }

    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({ error: '获取看板详情失败', details: error.message });
  }
};

// 更新看板
export const updateBoard = async (req, res) => {
  try {
    const { id: boardId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: '看板标题不能为空' });
    }

    // 权限检查已由中间件完成（需要编辑或所有者权限）
    const board = await prisma.board.update({
      where: {
        id: parseInt(boardId)
      },
      data: {
        title
      },
      select: {
        id: true,
        title: true
      }
    });

    res.status(200).json({ message: '看板更新成功', board });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: '看板不存在' });
    }
    res.status(500).json({ error: '更新看板失败', details: error.message });
  }
};

// 删除看板
export const deleteBoard = async (req, res) => {
  try {
    const { id: boardId } = req.params;

    // 权限检查已由中间件完成（需要所有者权限）
    await prisma.board.delete({
      where: {
        id: parseInt(boardId)
      }
    });

    res.status(200).json({ message: '看板删除成功' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: '看板不存在' });
    }
    res.status(500).json({ error: '删除看板失败', details: error.message });
  }
};

// 添加看板成员
export const addBoardMember = async (req, res) => {
  try {
    const { id: boardId } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: '缺少用户ID或角色' });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 添加成员
    const boardMember = await prisma.boardMember.create({
      data: {
        userId,
        boardId: parseInt(boardId),
        role
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ message: '成员添加成功', member: boardMember });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '该用户已经是看板成员' });
    }
    res.status(500).json({ error: '添加成员失败', details: error.message });
  }
};

// 更新看板成员角色
export const updateBoardMemberRole = async (req, res) => {
  try {
    const { boardId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: '缺少角色信息' });
    }

    const boardMember = await prisma.boardMember.update({
      where: {
        userId_boardId: {
          userId,
          boardId: parseInt(boardId)
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({ message: '角色更新成功', member: boardMember });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: '成员不存在' });
    }
    res.status(500).json({ error: '更新角色失败', details: error.message });
  }
};

// 删除看板成员
export const removeBoardMember = async (req, res) => {
  try {
    const { boardId, userId } = req.params;

    await prisma.boardMember.delete({
      where: {
        userId_boardId: {
          userId,
          boardId: parseInt(boardId)
        }
      }
    });

    res.status(200).json({ message: '成员删除成功' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: '成员不存在' });
    }
    res.status(500).json({ error: '删除成员失败', details: error.message });
  }
};
