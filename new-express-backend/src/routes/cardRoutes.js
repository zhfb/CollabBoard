import express from 'express';
import auth from '../middleware/auth.js';
import { isEditor } from '../middleware/boardAuth.js';
import {
  createCard,
  updateCard,
  deleteCard,
  moveCard
} from '../controllers/cardController.js';

const router = express.Router();

// 所有卡片路由都需要JWT认证
router.use(auth);

// 创建卡片（基于列表ID）- 需要编辑或所有者权限
router.post('/list/:listId', isEditor, createCard);

// 更新卡片 - 需要编辑或所有者权限
router.put('/:id', isEditor, updateCard);

// 删除卡片 - 需要编辑或所有者权限
router.delete('/:id', isEditor, deleteCard);

// 移动卡片 - 需要编辑或所有者权限
router.put('/:id/move', isEditor, moveCard);

export default router;
