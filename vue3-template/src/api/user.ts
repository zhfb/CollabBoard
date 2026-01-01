import request from '../utils/request'

// 用户登录
export const login = (data: { username: string; password: string }) => {
  return request.post('/auth/login', data)
}

// 用户注册
export const register = (data: { username: string; email: string; password: string }) => {
  return request.post('/auth/register', data)
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/user/info')
}

// 更新用户信息
export const updateUserInfo = (data: any) => {
  return request.put('/user/info', data)
}
