// Token工具函数

// 存储Token
export const setToken = (token: string): void => {
  localStorage.setItem('token', token)
}

// 获取Token
export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

// 删除Token
export const removeToken = (): void => {
  localStorage.removeItem('token')
}

// 检查Token是否存在
export const hasToken = (): boolean => {
  return !!getToken()
}