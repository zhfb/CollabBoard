// 看板权限中间件
import prisma from '../prisma/index.js';

// 定义权限级别
export const BOARD_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// 权限检查中间件
export const boardAuth = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // 确保用户已认证
      if (!req.user) {
        return res.status(401).json({ error: '请先登录' });
      }
      
      // 获取看板ID
      let boardId = req.params.boardId || req.body.boardId;
      
      // 如果没有直接提供boardId，尝试通过listId获取
      if (!boardId && (req.params.listId || req.body.listId || req.body.targetListId)) {
        const listId = req.params.listId || req.body.listId || req.body.targetListId;
        const list = await prisma.list.findUnique({
          where: { id: parseInt(listId) },
          select: { boardId: true }
        });
        if (list) {
          boardId = list.boardId;
        }
      }
      
      if (!boardId) {
        return res.status(400).json({ error: '缺少看板ID' });
      }
      
      // 查询用户在看板中的角色
      const boardMember = await prisma.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId: req.user.id,
            boardId: parseInt(boardId)
          }
        }
      });
      
      // 如果用户是看板所有者，直接通过
      const board = await prisma.board.findUnique({
        where: { id: parseInt(boardId) }
      });
      
      let userRole = null;
      
      // 检查是否是所有者
      if (board && board.ownerId === req.user.id) {
        userRole = BOARD_ROLES.OWNER;
      } else if (boardMember) {
        // 否则使用成员角色
        userRole = boardMember.role;
      }
      
      // 检查是否有访问权限
      if (!userRole) {
        return res.status(403).json({ error: '您没有访问此看板的权限' });
      }
      
      // 定义角色权限级别
      const roleHierarchy = {
        [BOARD_ROLES.OWNER]: 3,
        [BOARD_ROLES.EDITOR]: 2,
        [BOARD_ROLES.VIEWER]: 1
      };
      
      // 检查是否满足所需权限
      if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: `您需要${requiredRole}权限才能执行此操作` });
      }
      
      // 注入权限信息到请求对象
      req.boardRole = userRole;
      req.boardId = parseInt(boardId);
      
      next();
    } catch (error) {
      console.error('权限检查失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };
};

// 检查是否为所有者
export const isOwner = boardAuth(BOARD_ROLES.OWNER);

// 检查是否为编辑者或所有者
export const isEditor = boardAuth(BOARD_ROLES.EDITOR);

// 检查是否为查看者或以上
export const isViewer = boardAuth(BOARD_ROLES.VIEWER);
