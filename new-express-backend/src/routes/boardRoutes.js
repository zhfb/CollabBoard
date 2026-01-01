import express from 'express';
import auth from '../middleware/auth.js';
import { isOwner, isEditor, isViewer } from '../middleware/boardAuth.js';
import {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addBoardMember,
  updateBoardMemberRole,
  removeBoardMember
} from '../controllers/boardController.js';

const router = express.Router();

// 所有看板路由都需要JWT认证
router.use(auth);

// 创建看板
router.post('/', createBoard);

// 获取用户的所有看板
router.get('/', getBoards);

// 获取单个看板详情 - 需要查看权限
router.get('/:id', isViewer, getBoardById);

// 更新看板 - 需要编辑或所有者权限
router.put('/:id', isEditor, updateBoard);

// 删除看板 - 需要所有者权限
router.delete('/:id', isOwner, deleteBoard);

// 成员管理路由
// 添加成员 - 需要所有者权限
router.post('/:id/members', isOwner, addBoardMember);

// 更新成员角色 - 需要所有者权限
router.put('/:boardId/members/:userId', isOwner, updateBoardMemberRole);

// 删除成员 - 需要所有者权限
router.delete('/:boardId/members/:userId', isOwner, removeBoardMember);

export default router;
