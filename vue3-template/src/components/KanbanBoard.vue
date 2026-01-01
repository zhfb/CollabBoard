<template>
  <div class="kanban-board">
    <div class="kanban-header">
      <h2>{{ currentBoard?.title || '看板' }}</h2>
      <el-button type="primary" @click="showCreateListDialog = true">添加列表</el-button>
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
        <div class="kanban-list" data-list-id="{{ list.id }}">
          <div class="list-header" data-id="{{ list.id }}">
            <h3>{{ list.title }}</h3>
            <el-button type="danger" size="small" @click="deleteList(list.id)">删除</el-button>
          </div>
          
          <draggable
            v-model="list.cards"
            class="kanban-cards"
            item-key="id"
            ghost-class="ghost-card"
            group="cards"
            @end="handleCardDragEnd"
          >
            <template #item="{ element: card }">
              <div class="kanban-card" data-id="{{ card.id }}">
                <h4>{{ card.title }}</h4>
                <p v-if="card.description">{{ card.description }}</p>
                <div class="card-footer">
                  <span v-if="card.due_date">{{ formatDate(card.due_date) }}</span>
                  <el-button type="text" size="small" @click="deleteCard(card.id)">删除</el-button>
                </div>
              </div>
            </template>
          </draggable>

          <div class="list-footer">
            <el-button type="text" size="small" @click="showCreateCardDialog = true; currentList = list">添加卡片</el-button>
          </div>
        </div>
      </template>
    </draggable>

    <!-- 创建列表对话框 -->
    <el-dialog
      v-model="showCreateListDialog"
      title="创建列表"
      width="30%"
    >
      <el-form :model="listForm" label-position="top">
        <el-form-item label="列表名称">
          <el-input v-model="listForm.title" placeholder="请输入列表名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateListDialog = false">取消</el-button>
          <el-button type="primary" @click="createList">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建卡片对话框 -->
    <el-dialog
      v-model="showCreateCardDialog"
      title="创建卡片"
      width="30%"
    >
      <el-form :model="cardForm" label-position="top">
        <el-form-item label="卡片标题">
          <el-input v-model="cardForm.title" placeholder="请输入卡片标题" />
        </el-form-item>
        <el-form-item label="卡片描述">
          <el-input v-model="cardForm.description" type="textarea" placeholder="请输入卡片描述" rows="3" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="cardForm.due_date"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateCardDialog = false">取消</el-button>
          <el-button type="primary" @click="createCard">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { useKanbanStore } from '../stores/kanban'
import { useRoute } from 'vue-router'

const kanbanStore = useKanbanStore()
const route = useRoute()

// 获取当前看板ID
const boardId = computed(() => parseInt(route.params.id as string) || 1)

// 当前看板数据
const currentBoard = computed(() => kanbanStore.currentBoard)

// 列表数据（计算属性，从当前看板中获取）
const lists = computed(() => currentBoard.value?.lists || [])

// 对话框状态
const showCreateListDialog = ref(false)
const showCreateCardDialog = ref(false)

// 当前选中的列表
const currentList = ref<any>(null)

// 表单数据
const listForm = ref({
  title: ''
})

const cardForm = ref({
  title: '',
  description: '',
  due_date: ''
})

// 加载看板数据
onMounted(async () => {
  try {
    await kanbanStore.fetchBoard(boardId.value)
    // 初始化Socket.io连接
    kanbanStore.initSocket()
  } catch (error) {
    ElMessage.error('加载看板失败')
  }
})

// 创建列表
const createList = async () => {
  if (!listForm.value.title.trim()) {
    ElMessage.warning('请输入列表名称')
    return
  }

  try {
    await kanbanStore.createList({
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

// 删除列表
const deleteList = async (id: number) => {
  try {
    await kanbanStore.deleteList(id)
    ElMessage.success('列表删除成功')
  } catch (error) {
    ElMessage.error('删除列表失败')
  }
}

// 创建卡片
const createCard = async () => {
  if (!cardForm.value.title.trim()) {
    ElMessage.warning('请输入卡片标题')
    return
  }

  if (!currentList.value) {
    ElMessage.warning('请选择列表')
    return
  }

  try {
    await kanbanStore.createCard({
      title: cardForm.value.title,
      description: cardForm.value.description,
      list_id: currentList.value.id,
      order: currentList.value.cards.length,
      due_date: cardForm.value.due_date
    })
    ElMessage.success('卡片创建成功')
    showCreateCardDialog.value = false
    cardForm.value = {
      title: '',
      description: '',
      due_date: ''
    }
    currentList.value = null
  } catch (error) {
    ElMessage.error('创建卡片失败')
  }
}

// 删除卡片
const deleteCard = async (id: number) => {
  try {
    await kanbanStore.deleteCard(id)
    ElMessage.success('卡片删除成功')
  } catch (error) {
    ElMessage.error('删除卡片失败')
  }
}

// 处理列表拖拽结束事件
const handleListDragEnd = (event: any) => {
  const { oldIndex, newIndex } = event
  if (oldIndex !== newIndex && currentBoard.value) {
    // 更新列表顺序
    currentBoard.value.lists.forEach((list, index) => {
      list.order = index
      kanbanStore.updateListOrder(list.id, index)
    })
  }
}

// 处理卡片拖拽结束事件
const handleCardDragEnd = (event: any) => {
  const { to, from, oldIndex, newIndex, draggable } = event
  const cardId = parseInt(draggable.dataset.id)
  const fromListId = parseInt(from.dataset.listId)
  const toListId = parseInt(to.dataset.listId)
  const newCardOrder = newIndex

  if (oldIndex !== newIndex) {
    // 如果卡片移动到了新列表
    if (fromListId !== toListId) {
      // 更新卡片的list_id和order
      kanbanStore.updateCard(cardId, {
        list_id: toListId,
        order: newCardOrder
      })
      
      // 更新新列表中所有卡片的order
      if (currentBoard.value) {
        const toList = currentBoard.value.lists.find(list => list.id === toListId)
        if (toList) {
          toList.cards.forEach((card, index) => {
            kanbanStore.updateCardOrder(card.id, toListId, index)
          })
        }
      }
    } else {
      // 更新同一列表中所有卡片的order
      if (currentBoard.value) {
        const list = currentBoard.value.lists.find(list => list.id === fromListId)
        if (list) {
          list.cards.forEach((card, index) => {
            kanbanStore.updateCardOrder(card.id, fromListId, index)
          })
        }
      }
    }
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
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
}

.kanban-lists {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.kanban-list {
  min-width: 300px;
  background-color: #ebecf0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  cursor: move;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.kanban-cards {
  min-height: 100px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kanban-card {
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: transform 0.2s ease;
}

.kanban-card:hover {
  transform: translateY(-2px);
}

.kanban-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.kanban-card p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #888;
}

.list-footer {
  display: flex;
  justify-content: center;
}

/* 拖拽样式 */
.ghost-list {
  opacity: 0.5;
  background-color: #ccc;
}

.ghost-card {
  opacity: 0.5;
  background-color: #ff0;
}
</style>