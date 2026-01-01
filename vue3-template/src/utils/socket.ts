import { io, Socket } from 'socket.io-client'

// 创建Socket.io实例
const socket: Socket = io(import.meta.env.VITE_SOCKET_BASE_URL || 'http://localhost:3001', {
  transports: ['websocket'],
  autoConnect: false
})

// 连接事件处理
socket.on('connect', () => {
  console.log('Socket.io connected:', socket.id)
})

// 断开连接事件处理
socket.on('disconnect', () => {
  console.log('Socket.io disconnected')
})

// 错误事件处理
socket.on('connect_error', (error) => {
  console.error('Socket.io connection error:', error)
})

export default socket
