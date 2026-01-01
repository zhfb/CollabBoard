<template>
  <div class="kanban-list list" :data-list-id="list.id">
    <div class="list-header" :data-id="list.id">
      <h3>{{ list.title }}</h3>
      <el-button type="danger" size="small" @click="handleDelete" class="delete-list-btn">删除</el-button>
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
        <CardItem :card="card" />
      </template>
    </draggable>

    <div class="list-footer">
      <el-button type="text" size="small" @click="showCreateCardDialog = true" class="add-card-btn">添加卡片</el-button>
    </div>

    <!-- 创建卡片对话框 -->
    <el-dialog
      v-model="showCreateCardDialog"
      title="创建卡片"
      width="30%"
    >
      <el-form :model="cardForm" label-position="top">
        <el-form-item label="卡片标题" required>
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
          <el-button type="primary" @click="handleCreateCard">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { useBoardStore, type List } from '../stores/boardStore'
import CardItem from './CardItem.vue'

// 定义组件属性
const props = defineProps<{
  list: List
}>()

// 定义组件事件
const emit = defineEmits<{
  (e: 'cardDragEnd', event: any): void
}>()

// 获取boardStore
const boardStore = useBoardStore()

// 对话框状态
const showCreateCardDialog = ref(false)

// 表单数据
const cardForm = ref({
  title: '',
  description: '',
  due_date: ''
})

// 删除列表
const handleDelete = async () => {
  try {
    await boardStore.deleteList(props.list.id)
    ElMessage.success('列表删除成功')
  } catch (error) {
    ElMessage.error('删除列表失败')
  }
}

// 创建卡片
const handleCreateCard = async () => {
  if (!cardForm.value.title.trim()) {
    ElMessage.warning('请输入卡片标题')
    return
  }

  try {
    await boardStore.createCard({
      title: cardForm.value.title,
      description: cardForm.value.description,
      list_id: props.list.id,
      order: props.list.cards.length,
      due_date: cardForm.value.due_date
    })
    ElMessage.success('卡片创建成功')
    showCreateCardDialog.value = false
    // 重置表单
    cardForm.value = {
      title: '',
      description: '',
      due_date: ''
    }
  } catch (error) {
    ElMessage.error('创建卡片失败')
  }
}

// 处理卡片拖拽结束事件
const handleCardDragEnd = (event: any) => {
  emit('cardDragEnd', event)
}
</script>

<style scoped>
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

.delete-list-btn {
  padding: 0 6px;
  height: 24px;
}

.kanban-cards {
  min-height: 100px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-footer {
  display: flex;
  justify-content: center;
}

.add-card-btn {
  width: 100%;
  text-align: center;
  padding: 8px 0;
  color: #5e6c84;
}

.add-card-btn:hover {
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
}

/* 拖拽样式 */
.ghost-card {
  opacity: 0.5;
  background-color: #ff0;
}
</style>
