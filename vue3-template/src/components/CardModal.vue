<template>
  <el-dialog v-model="dialogVisible" :title="card.id ? '编辑卡片' : '创建卡片'" width="700px" :close-on-click-modal="false" destroy-on-close>
    <el-form :model="localCard" label-width="100px" ref="formRef">
      <el-form-item label="标题" required>
        <el-input v-model="localCard.title" placeholder="输入卡片标题" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input type="textarea" v-model="localCard.description" rows="5" placeholder="添加详细描述..." />
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="localCard.labels" multiple placeholder="选择或创建标签" style="width: 100%">
          <el-option v-for="label in labelOptions" :key="label.id" :label="label.name" :value="label" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止日期">
        <el-date-picker v-model="localCard.dueDate" type="datetime" placeholder="选择截止时间" style="width: 100%" />
      </el-form-item>
      <el-form-item label="附件">
        <el-upload 
          list-type="picture-card" 
          :limit="5"
          :file-list="localCard.attachments"
          :auto-upload="false"
        >
          <el-icon><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip">支持图片、文档，最多5个</div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item label="评论">
        <div class="comments">
          <div v-for="comment in localCard.comments" :key="comment.id" class="comment-item">
            <strong>{{ comment.user }}</strong>: {{ comment.text }}
            <span class="time">{{ comment.time }}</span>
          </div>
        </div>
        <el-input type="textarea" v-model="newComment" placeholder="写评论..." rows="3" />
        <el-button type="primary" @click="addComment" style="margin-top: 10px;">发送</el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="danger" @click="deleteCard">删除卡片</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Card } from '../stores/boardStore'

const props = defineProps<{
  visible: boolean
  card?: Partial<Card> & { dueDate?: string; labels?: any[]; comments?: any[]; attachments?: any[] }
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [card: any]
  delete: [cardId: number]
}>()

const dialogVisible = ref(false)
const formRef = ref()
const localCard = ref<Partial<Card> & { dueDate?: string; labels?: any[]; comments?: any[]; attachments?: any[] }>({})
const newComment = ref('')

// 标签选项
const labelOptions = ref([
  { id: 1, name: '重要', color: 'danger' },
  { id: 2, name: '待办', color: 'warning' },
  { id: 3, name: '进行中', color: 'primary' },
  { id: 4, name: '已完成', color: 'success' }
])

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
  }
)

// 监听dialogVisible变化，通知父组件
watch(
  dialogVisible,
  (newVal) => {
    emit('update:visible', newVal)
  }
)

// 监听card变化，更新表单
watch(
  () => props.card,
  (newCard) => {
    if (newCard) {
      localCard.value = {
        ...newCard,
        comments: newCard.comments || [],
        attachments: newCard.attachments || []
      }
    } else {
      // 创建新卡片时重置表单
      localCard.value = {
        title: '',
        description: '',
        dueDate: undefined,
        labels: [],
        comments: [],
        attachments: []
      }
    }
  },
  { deep: true }
)

onMounted(() => {
  if (props.card) {
    localCard.value = {
      ...props.card,
      comments: props.card.comments || [],
      attachments: props.card.attachments || []
    }
  }
})

const handleSave = async () => {
  if (!localCard.value.title?.trim()) {
    ElMessage.warning('请输入卡片标题')
    return
  }

  emit('save', localCard.value)
  dialogVisible.value = false
  ElMessage.success('卡片已保存')
}

const addComment = () => {
  if (newComment.value.trim()) {
    const comment = {
      id: Date.now(),
      user: '当前用户',
      text: newComment.value,
      time: new Date().toLocaleString()
    }
    if (!localCard.value.comments) {
      localCard.value.comments = []
    }
    localCard.value.comments.push(comment)
    newComment.value = ''
  }
}

const deleteCard = () => {
  if (localCard.value.id) {
    emit('delete', localCard.value.id)
    dialogVisible.value = false
  }
}
</script>

<style scoped>
.comment-item {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.time {
  font-size: 12px;
  color: #999;
  float: right;
}
</style>