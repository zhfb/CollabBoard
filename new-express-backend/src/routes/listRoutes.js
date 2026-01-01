import express from 'express';
import auth from '../middleware/auth.js';
import { isEditor } from '../middleware/boardAuth.js';
import {
  createList,
  updateList,
  deleteList,
  reorderLists
} from '../controllers/listController.js';

const router = express.Router();

// 所有列表路由都需要JWT认证
router.use(auth);

// 创建列表（基于看板ID）- 需要编辑或所有者权限
router.post('/board/:boardId', isEditor, createList);

// 更新列表 - 需要编辑或所有者权限
router.put('/:id', isEditor, updateList);

// 删除列表 - 需要编辑或所有者权限
router.delete('/:id', isEditor, deleteList);

// 重排序列表 - 需要编辑或所有者权限
router.put('/board/:boardId/reorder', isEditor, reorderLists);

export default router;
