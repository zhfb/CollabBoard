<template>
  <div class="kanban-card card" :data-id="card.id" :class="{ 'expiring-soon': isExpiringSoon, 'expired': isExpired }">
    <h4>{{ card.title }}</h4>
    <p v-if="card.description" class="card-description">{{ card.description }}</p>
    <div class="card-footer">
      <span v-if="card.due_date" class="card-due-date">
        {{ formatDueDate(card.due_date) }}
      </span>
      <el-button type="text" size="small" @click="handleDelete" class="delete-btn">删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useBoardStore, type Card } from '../stores/boardStore'

// 定义组件属性
const props = defineProps<{
  card: Card
}>()

// 获取boardStore
const boardStore = useBoardStore()

// 删除卡片
const handleDelete = async () => {
  try {
    await boardStore.deleteCard(props.card.id)
    ElMessage.success('卡片删除成功')
  } catch (error) {
    ElMessage.error('删除卡片失败')
  }
}

// 计算卡片是否即将过期（24小时内）
const isExpiringSoon = computed(() => {
  if (!props.card.due_date) return false
  const dueDate = new Date(props.card.due_date)
  const now = new Date()
  const diffInHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  return diffInHours > 0 && diffInHours <= 24
})

// 计算卡片是否已过期
const isExpired = computed(() => {
  if (!props.card.due_date) return false
  const dueDate = new Date(props.card.due_date)
  const now = new Date()
  return dueDate < now
})

// 格式化日期并显示剩余时间
const formatDueDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  
  if (diffInMs < 0) {
    // 已过期
    const days = Math.floor(Math.abs(diffInMs) / (1000 * 60 * 60 * 24))
    return days > 0 ? `已过期 ${days} 天` : '已过期'
  }
  
  // 未过期
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days}天${hours}小时后到期`
  } else if (hours > 0) {
    return `${hours}小时后到期`
  } else {
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60))
    return minutes > 0 ? `${minutes}分钟后到期` : '即将到期'
  }
}
</script>

<style scoped>
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
  word-break: break-word;
}

.card-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  word-break: break-word;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #888;
}

.card-due-date {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.delete-btn {
  padding: 0;
  color: #ff4d4f;
}

/* 即将过期卡片样式 */
.kanban-card.expiring-soon {
  border: 1px solid #ffa39e;
  background-color: #fff2f0;
}

.kanban-card.expiring-soon .card-due-date {
  background-color: #ffccc7;
  color: #d4380d;
}

/* 已过期卡片样式 */
.kanban-card.expired {
  border: 1px solid #ffd591;
  background-color: #fffbe6;
}

.kanban-card.expired .card-due-date {
  background-color: #ffe7ba;
  color: #d46b08;
}
</style>
