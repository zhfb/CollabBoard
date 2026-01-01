<template>
  <div class="board-detail" :style="{ background: board.color || '#0079bf' }">
    <div class="board-header">
      <h1 class="board-title">{{ board.title }}</h1>
      <div class="header-actions">
        <el-button type="info" plain round @click="inviteMember">邀请成员</el-button>
        <el-button type="success" plain round @click="addList">+ 添加列表</el-button>
      </div>
    </div>
    <div class="lists-container">
      <draggable v-model="lists" group="lists" item-key="id" handle=".list-header" animation="300">
        <template #item="{ element: list }">
          <div class="list-wrapper">
            <div class="list-header">
              <h3>{{ list.title }} ({{ list.cards.length }})</h3>
              <el-dropdown trigger="click">
                <el-button type="text" icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="deleteList(list.id)">删除列表</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <draggable v-model="list.cards" group="cards" item-key="id" animation="200">
              <template #item="{ element: card }">
                <el-card class="card-item" shadow="hover" @click="openCardModal(card)">
                  <div class="card-title">{{ card.title }}</div>
                  <div class="card-meta">
                    <el-tag v-if="card.dueDate" size="small" type="danger">截止 {{ formatDate(card.dueDate) }}</el-tag>
                    <el-tag v-if="card.labels" v-for="label in card.labels" :key="label" size="small" :color="label.color">{{ label.name }}</el-tag>
                  </div>
                </el-card>
              </template>
            </draggable>
            <el-button type="text" class="add-card-btn" @click="addCard(list.id)">+ 添加卡片</el-button>
          </div>
        </template>
      </draggable>
      <div class="add-list-card" @click="addList">
        + 添加另一个列表
      </div>
    </div>
    <CardModal v-model:visible="modalVisible" :card="currentCard" @save="saveCard" @delete="deleteCard" />
    
    <!-- 添加列表对话框 -->
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
    
    <!-- 添加卡片对话框 -->
    <el-dialog
      v-model="showCreateCardDialog"
      title="创建卡片"
      width="30%"
    >
      <el-form :model="cardForm" label-position="top">
        <el-form-item label="卡片标题" required>
          <el-input v-model="cardForm.title" placeholder="请输入卡片标题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateCardDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateCard">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import CardModal from '../components/CardModal.vue'
import { useBoardStore, type List, type Card, type Board } from '../stores/boardStore'

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()

// 获取当前看板ID
const boardId = computed(() => parseInt(route.params.id as string))

// 看板数据
const board = ref<Board>({ id: 0, title: 'CollabBoard 示例看板', user_id: 0, lists: [], color: '#0079bf' })
const lists = ref<List[]>([])

// 模态框状态
const modalVisible = ref(false)
const currentCard = ref<Partial<Card> & { dueDate?: string; labels?: any[]; comments?: any[]; attachments?: any[] }>({})

// 对话框状态
const showCreateListDialog = ref(false)
const showCreateCardDialog = ref(false)
const currentListId = ref<number>(0)

// 表单数据
const listForm = ref({ title: '' })
const cardForm = ref({ title: '' })

// 页面加载时获取看板数据
onMounted(async () => {
  try {
    const boardData = await boardStore.fetchBoard(boardId.value)
    board.value = boardData
    lists.value = boardData.lists
    // 初始化Socket.io连接
    boardStore.initSocket()
    // 加入看板房间
    boardStore.joinBoard(boardId.value)
  } catch (error) {
    ElMessage.error('加载看板失败')
    router.push('/boards')
  }
})

// 打开卡片模态框
const openCardModal = (card: Card & { dueDate?: string; labels?: any[] }) => {
  currentCard.value = { ...card }
  modalVisible.value = true
}

// 保存卡片
const saveCard = async (updatedCard: any) => {
  try {
    if (updatedCard.id) {
      // 更新卡片
      await boardStore.updateCard(updatedCard.id, {
        title: updatedCard.title,
        description: updatedCard.description,
        due_date: updatedCard.dueDate,
        labels: updatedCard.labels,
        comments: updatedCard.comments,
        attachments: updatedCard.attachments
      })
      ElMessage.success('卡片更新成功')
    } else {
      // 创建卡片
      await boardStore.createCard({
        title: updatedCard.title,
        description: updatedCard.description || '',
        list_id: updatedCard.list_id,
        order: updatedCard.order || 0,
        due_date: updatedCard.dueDate,
        labels: updatedCard.labels || [],
        comments: updatedCard.comments || [],
        attachments: updatedCard.attachments || []
      })
      ElMessage.success('卡片创建成功')
    }
    // 刷新看板数据
    await refreshBoardData()
  } catch (error) {
    ElMessage.error('保存卡片失败')
  }
}

// 刷新看板数据
const refreshBoardData = async () => {
  try {
    const boardData = await boardStore.fetchBoard(boardId.value)
    board.value = boardData
    lists.value = boardData.lists
  } catch (error) {
    console.error('刷新看板数据失败:', error)
  }
}

// 邀请成员
const inviteMember = () => {
  // 实现邀请成员功能
  ElMessage.info('邀请成员功能开发中...')
}

// 添加列表
const addList = () => {
  showCreateListDialog.value = true
  listForm.value = { title: '' }
}

// 处理创建列表
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
    // 刷新看板数据
    await refreshBoardData()
  } catch (error) {
    ElMessage.error('创建列表失败')
  }
}

// 删除列表
const deleteList = async (id: number) => {
  try {
    await boardStore.deleteList(id)
    ElMessage.success('列表删除成功')
    // 刷新看板数据
    await refreshBoardData()
  } catch (error) {
    ElMessage.error('删除列表失败')
  }
}

// 添加卡片
const addCard = (listId: number) => {
  currentListId.value = listId
  showCreateCardDialog.value = true
  cardForm.value = { title: '' }
}

// 处理创建卡片
const handleCreateCard = async () => {
  if (!cardForm.value.title.trim()) {
    ElMessage.warning('请输入卡片标题')
    return
  }

  try {
    // 找到当前列表
    const list = lists.value.find(l => l.id === currentListId.value)
    if (!list) return

    await boardStore.createCard({
      title: cardForm.value.title,
      description: '',
      list_id: currentListId.value,
      order: list.cards.length
    })
    ElMessage.success('卡片创建成功')
    showCreateCardDialog.value = false
    // 刷新看板数据
    await refreshBoardData()
  } catch (error) {
    ElMessage.error('创建卡片失败')
  }
}

// 删除卡片
const deleteCard = async (cardId: number) => {
  try {
    await boardStore.deleteCard(cardId)
    ElMessage.success('卡片删除成功')
    // 刷新看板数据
    await refreshBoardData()
  } catch (error) {
    ElMessage.error('删除卡片失败')
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.board-detail {
  min-height: 100vh;
  padding: 20px;
  background-size: cover;
  background-position: center;
}
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
.board-title {
  font-size: 36px;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.header-actions {
  display: flex;
  gap: 15px;
}
.lists-container {
  display: flex;
  gap: 25px;
  overflow-x: auto;
  padding: 20px 0;
}
.list-wrapper {
  background: #e2e4e6;
  border-radius: 12px;
  width: 320px;
  min-height: 100px;
  padding: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 10px;
  font-weight: bold;
  cursor: move;
  color: #333;
}
.card-item {
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}
.card-item:hover {
  transform: translateX(8px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.card-title {
  font-weight: bold;
  margin-bottom: 8px;
}
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.add-card-btn {
  width: 100%;
  color: #666;
  margin-top: 10px;
}
.add-card-btn:hover {
  background: rgba(0,0,0,0.05);
  color: #333;
}
.add-list-card {
  width: 320px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 16px;
  min-height: 100px;
  backdrop-filter: blur(5px);
}
.add-list-card:hover {
  background: rgba(255,255,255,0.3);
}
</style>