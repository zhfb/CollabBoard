<template>
  <div class="kanban-board">
    <div class="kanban-header">
      <h2>{{ currentBoard?.title || '看板' }}</h2>
      <el-button type="primary" @click="showCreateListDialog = true" class="add-list-btn">添加列表</el-button>
    </div>

    <draggable
      v-model="lists"
      class="kanban-lists"
      item-key="id"
      handle=".list-header"
      ghost-class="ghost-list"
      @end="handleListDragEnd"
    >
      <template #item="{ element: list }">
        <ListColumn 
          :list="list" 
          @cardDragEnd="handleCardDragEnd"
        />
      </template>
    </draggable>

    <!-- 创建列表对话框 -->
    <el-dialog
      v-model="showCreateListDialog"
      title="创建列表"
      width="30%"
    >
      <el-form :model="listForm" label-position="top">
        <el-form-item label="列表名称" required>
          <el-input v-model="listForm.title" placeholder="请输入列表名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateListDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateList">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { useBoardStore, type List } from '../stores/boardStore'
import ListColumn from './ListColumn.vue'
import { useRoute } from 'vue-router'

// 获取boardStore
const boardStore = useBoardStore()
const route = useRoute()

// 获取当前看板ID
const boardId = computed(() => parseInt(route.params.id as string) || 1)

// 当前看板数据
const currentBoard = computed(() => boardStore.currentBoard)

// 列表数据（计算属性，从当前看板中获取）
const lists = computed(() => currentBoard.value?.lists || [])

// 对话框状态
const showCreateListDialog = ref(false)

// 表单数据
const listForm = ref({
  title: ''
})

// 加载看板数据
onMounted(async () => {
  try {
    await boardStore.fetchBoard(boardId.value)
    // 初始化Socket.io连接
    boardStore.initSocket()
    // 加入看板房间
    boardStore.joinBoard(boardId.value)
  } catch (error) {
    ElMessage.error('加载看板失败')
  }
})

// 创建列表
const handleCreateList = async () => {
  if (!listForm.value.title.trim()) {
    ElMessage.warning('请输入列表名称')
    return
  }

  try {
    await boardStore.createList({
      title: listForm.value.title,
      board_id: boardId.value,
      order: lists.value.length
    })
    ElMessage.success('列表创建成功')
    showCreateListDialog.value = false
    listForm.value.title = ''
  } catch (error) {
    ElMessage.error('创建列表失败')
  }
}

// 处理列表拖拽结束事件
const handleListDragEnd = (event: any) => {
  boardStore.handleListDragEnd(event)
}

// 处理卡片拖拽结束事件
const handleCardDragEnd = (event: any) => {
  boardStore.handleCardDragEnd(event)
}
</script>

<style scoped>
.kanban-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: #f5f5f5;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.kanban-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.add-list-btn {
  padding: 8px 16px;
  font-size: 14px;
}

.kanban-lists {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
  padding-left: 10px;
  padding-right: 10px;
  height: calc(100% - 80px);
}

/* 拖拽样式 */
.ghost-list {
  opacity: 0.5;
  background-color: #ccc;
  border-radius: 8px;
  min-width: 300px;
  padding: 12px;
}

/* 滚动条样式 */
.kanban-lists::-webkit-scrollbar {
  height: 8px;
}

.kanban-lists::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.kanban-lists::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.kanban-lists::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
