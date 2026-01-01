<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <h2 class="title">欢迎登录 CollabBoard</h2>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名或邮箱"
            size="large"
            prefix-icon="User"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
          ></el-input>
        </el-form-item>
        <el-button type="primary" size="large" @click="login" :loading="loading" round block>
          登录
        </el-button>
        <p class="tip">没有账号？<router-link to="/register">立即注册</router-link></p>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

// 登录表单数据
const form = reactive({
  username: '',
  password: ''
})

// 登录表单验证规则
const rules = {
  username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 处理登录
const login = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(form.username, form.password)
        ElMessage.success('登录成功，欢迎使用 CollabBoard！')
        router.push('/boards')
      } catch (error) {
        ElMessage.error('登录失败，请检查用户名或密码')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.title {
  text-align: center;
  margin-bottom: 40px;
  color: #2a5298;
  font-size: 32px;
  font-weight: bold;
}

.login-form {
  width: 100%;
}

.tip {
  text-align: center;
  margin-top: 25px;
  color: #666;
  font-size: 14px;
}

.tip a {
  color: #2a5298;
  text-decoration: none;
}

.tip a:hover {
  text-decoration: underline;
}
</style>