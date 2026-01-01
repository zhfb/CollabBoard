<template>
  <div class="home-container">
    <div class="header">
      <h1 class="title">欢迎回来！</h1>
      <div>
        <el-button type="primary" @click="showCreateBoardDialog = true">创建看板</el-button>
        <el-button @click="handleLogout">退出登录</el-button>
      </div>
    </div>
    <div class="content">
      <el-card class="user-card">
        <template #header>
          <div class="card-header">
            <span>用户信息</span>
          </div>
        </template>
        <div class="user-info" v-if="userStore.userInfo">
          <p><strong>用户名：</strong>{{ userStore.userInfo.username }}</p>
          <p><strong>邮箱：</strong>{{ userStore.userInfo.email }}</p>
        </div>
        <div v-else>
          <el-skeleton :rows="3" animated />
        </div>
      </el-card>

      <el-card class="boards-card">
        <template #header>
          <div class="card-header">
            <span>我的看板</span>
          </div>
        </template>
        <div class="boards-list" v-if="kanbanStore.boards.length > 0">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="board in kanbanStore.boards" :key="board.id">
              <el-card class="board-item" @click="goToBoard(board.id)">
                <h3>{{ board.title }}</h3>
                <p>{{ board.lists.length }} 个列表</p>
              </el-card>
            </el-col>
          </el-row>
        </div>
        <div class="no-boards" v-else>
          <p>您还没有创建任何看板，点击右上角按钮创建第一个看板吧！</p>
        </div>
      </el-card>
    </div>

    <!-- 创建看板对话框 -->
    <el-dialog
      v-model="showCreateBoardDialog"
      title="创建看板"
      width="30%"
    >
      <el-form :model="boardForm" label-position="top">
        <el-form-item label="看板名称">
          <el-input v-model="boardForm.title" placeholder="请输入看板名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateBoardDialog = false">取消</el-button>
          <el-button type="primary" @click="createBoard">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useKanbanStore } from '../stores/kanban'

const userStore = useUserStore()
const kanbanStore = useKanbanStore()
const router = useRouter()

// 对话框状态
const showCreateBoardDialog = ref(false)

// 表单数据
const boardForm = ref({
  title: ''
})

// 页面加载时获取用户信息和看板列表
onMounted(async () => {
  if (userStore.isLogin) {
    if (!userStore.userInfo) {
      await userStore.getUserInfo()
    }
    await kanbanStore.fetchBoards()
  }
})

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
}

// 导航到看板页面
const goToBoard = (boardId: number) => {
  router.push(`/board/${boardId}`)
}

// 创建看板
const createBoard = async () => {
  if (!boardForm.value.title.trim()) {
    ElMessage.warning('请输入看板名称')
    return
  }

  try {
    await kanbanStore.createBoard({
      title: boardForm.value.title,
      user_id: userStore.userInfo?.id || 1 // 假设用户ID为1（实际应该从用户信息中获取）
    })
    ElMessage.success('看板创建成功')
    showCreateBoardDialog.value = false
    boardForm.value.title = ''
  } catch (error) {
    ElMessage.error('创建看板失败')
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  width: 100%;
  max-width: 500px;
}

.boards-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  padding: 10px 0;
}

.user-info p {
  margin: 10px 0;
  color: #606266;
}

.boards-list {
  margin-top: 10px;
}

.board-item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.board-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.board-item h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.board-item p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.no-boards {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
</style>