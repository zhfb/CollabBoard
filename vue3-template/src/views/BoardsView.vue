<template>
  <div class="boards-container">
    <div class="header">
      <h1 class="page-title">我的看板 - CollabBoard</h1>
      <el-button type="primary" icon="Plus" size="large" round @click="createBoard">创建新看板</el-button>
    </div>
    <div class="boards-grid">
      <div v-for="board in boards" :key="board.id" class="board-card" @click="goToBoard(board.id)">
        <div class="board-bg" :style="{ background: board.color || '#4a90e2' }"></div>
        <div class="board-content">
          <h3>{{ board.title }}</h3>
          <p class="desc">{{ board.description || '无描述' }}</p>
          <span class="member-count">{{ board.members?.length || 1 }} 人协作</span>
        </div>
      </div>
      <div class="add-card" @click="createBoard">
        <el-icon :size="60" color="#aaa"><Plus /></el-icon>
        <p>创建新看板</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { useBoardStore } from '../stores/boardStore'

const router = useRouter()
const boardStore = useBoardStore()
const boards = ref([])

onMounted(async () => {
  boards.value = await boardStore.fetchBoards()
})

const goToBoard = (id: number) => router.push(`/board/${id}`)
const createBoard = () => {
  // 打开创建模态或调用API
  console.log('创建新看板')
}
</script>

<style scoped>
.boards-container {
  padding: 30px;
  background: #f0f2f5;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}
.page-title {
  font-size: 32px;
  color: #333;
}
.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}
.board-card {
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s;
}
.board-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
}
.board-bg {
  height: 100%;
  background-size: cover;
  opacity: 0.9;
}
.board-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
}
.board-content h3 {
  font-size: 20px;
  margin-bottom: 8px;
}
.desc {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}
.member-count {
  font-size: 12px;
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 12px;
}
.add-card {
  height: 180px;
  border-radius: 16px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s;
}
.add-card:hover {
  background: #f8f9fa;
  transform: translateY(-10px);
}
.add-card p {
  margin-top: 15px;
  color: #666;
  font-size: 16px;
}
</style>