import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { setToken, removeToken } from '../utils/token'
import router from '../router'

interface UserInfo {
  id: number
  username: string
  email: string
  // 其他用户信息字段
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<UserInfo | null>(null)
  const isLogin = ref(false)

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const response = await request.post('/auth/login', { username, password })
      if (response.token) {
        // 存储token
        setToken(response.token)
        // 获取用户信息
        await getUserInfo()
        // 跳转到首页
        router.push('/')
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  // 注册
  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await request.post('/auth/register', { username, email, password })
      if (response.token) {
        // 存储token
        setToken(response.token)
        // 获取用户信息
        await getUserInfo()
        // 跳转到首页
        router.push('/')
        return true
      }
      return false
    } catch (error) {
      console.error('注册失败:', error)
      return false
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const response = await request.get('/user/info')
      userInfo.value = response
      isLogin.value = true
      return response
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  // 登出
  const logout = () => {
    // 清除token
    removeToken()
    // 清除用户信息
    userInfo.value = null
    isLogin.value = false
    // 跳转到登录页
    router.push('/login')
  }

  return {
    userInfo,
    isLogin,
    login,
    register,
    getUserInfo,
    logout
  }
})