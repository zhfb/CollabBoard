import axios from 'axios'
import { getToken, removeToken } from './token'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 为所有请求添加token
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // 处理HTTP错误状态码
      switch (error.response.status) {
        case 401:
          // Token过期或无效，清除token并跳转到登录页
          removeToken()
          router.push('/login')
          break
        case 403:
          // 无权限访问
          console.error('无权限访问')
          break
        case 404:
          // 资源不存在
          console.error('请求的资源不存在')
          break
        case 500:
          // 服务器错误
          console.error('服务器错误')
          break
        default:
          console.error(`请求错误: ${error.response.status}`)
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('网络错误，未收到响应')
    } else {
      // 请求配置错误
      console.error('请求错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export default service