import { defineStore } from 'pinia'
import request from '../utils/request'
import socket from '../utils/socket'

export interface Card {
  id: number
  title: string
  description: string
  list_id: number
  order: number
  due_date?: string
  labels?: any[]
  comments?: any[]
  attachments?: any[]
}

export interface List {
  id: number
  title: string
  board_id: number
  order: number
  cards: Card[]
}

export interface Board {
  id: number
  title: string
  user_id: number
  lists: List[]
  color?: string
  description?: string
  members?: any[]
}

export const useBoardStore = defineStore('board', {
  state: () => ({
    boards: [] as Board[],
    currentBoard: null as Board | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    getBoardById: (state) => (id: number) => {
      return state.boards.find(board => board.id === id)
    },

    getListsByBoardId: (state) => (boardId: number) => {
      const board = state.boards.find(board => board.id === boardId)
      return board ? board.lists : []
    },

    getCardsByListId: (state) => (listId: number) => {
      for (const board of state.boards) {
        for (const list of board.lists) {
          if (list.id === listId) {
            return list.cards
          }
        }
      }
      return []
    }
  },

  actions: {
    async fetchBoards() {
      this.loading = true
      this.error = null
      try {
        const response = await request.get('/boards')
        this.boards = response.data
        return response.data
      } catch (error: any) {
        this.error = error.message || '获取看板失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchBoard(id: number) {
      this.loading = true
      this.error = null
      try {
        const response = await request.get(`/boards/${id}`)
        this.currentBoard = response.data
        // 更新boards数组中的对应看板
        const index = this.boards.findIndex(board => board.id === id)
        if (index !== -1) {
          this.boards[index] = response.data
        } else {
          this.boards.push(response.data)
        }
        return response.data
      } catch (error: any) {
        this.error = error.message || '获取看板详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createList(listData: Omit<List, 'id' | 'cards'>) {
      this.loading = true
      this.error = null
      try {
        const response = await request.post('/lists', listData)
        // 将新列表添加到对应看板中
        const boardIndex = this.boards.findIndex(board => board.id === listData.board_id)
        if (boardIndex !== -1) {
          this.boards[boardIndex].lists.push({ ...response.data, cards: [] })
        }
        // 更新当前看板（如果是同一个）
        if (this.currentBoard?.id === listData.board_id) {
          this.currentBoard.lists.push({ ...response.data, cards: [] })
        }
        return response.data
      } catch (error: any) {
        this.error = error.message || '创建列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteList(id: number) {
      this.loading = true
      this.error = null
      try {
        await request.delete(`/lists/${id}`)
        // 从所有看板中删除对应列表
        for (const board of this.boards) {
          board.lists = board.lists.filter(list => list.id !== id)
        }
        // 从当前看板中删除对应列表
        if (this.currentBoard) {
          this.currentBoard.lists = this.currentBoard.lists.filter(list => list.id !== id)
        }
      } catch (error: any) {
        this.error = error.message || '删除列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCard(cardData: Omit<Card, 'id'>) {
      this.loading = true
      this.error = null
      try {
        const response = await request.post('/cards', cardData)
        // 将新卡片添加到对应列表中
        for (const board of this.boards) {
          for (const list of board.lists) {
            if (list.id === cardData.list_id) {
              list.cards.push(response.data)
              // 按order排序卡片
              list.cards.sort((a, b) => a.order - b.order)
              break
            }
          }
        }
        return response.data
      } catch (error: any) {
        this.error = error.message || '创建卡片失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteCard(id: number) {
      this.loading = true
      this.error = null
      try {
        await request.delete(`/cards/${id}`)
        // 从所有列表中删除对应卡片
        for (const board of this.boards) {
          for (const list of board.lists) {
            list.cards = list.cards.filter(card => card.id !== id)
          }
        }
      } catch (error: any) {
        this.error = error.message || '删除卡片失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateCard(id: number, cardData: Partial<Card>) {
      this.loading = true
      this.error = null
      try {
        const response = await request.put(`/cards/${id}`, cardData)
        // 更新所有列表中的对应卡片
        for (const board of this.boards) {
          for (const list of board.lists) {
            const cardIndex = list.cards.findIndex(card => card.id === id)
            if (cardIndex !== -1) {
              // 如果卡片移动到了其他列表
              if (cardData.list_id && cardData.list_id !== list.id) {
                // 从当前列表删除卡片
                const [movedCard] = list.cards.splice(cardIndex, 1)
                // 找到目标列表并添加卡片
                const targetList = board.lists.find(l => l.id === cardData.list_id)
                if (targetList) {
                  targetList.cards.push({ ...movedCard, ...response.data })
                  targetList.cards.sort((a, b) => a.order - b.order)
                }
              } else {
                // 更新当前列表中的卡片
                list.cards[cardIndex] = { ...list.cards[cardIndex], ...response.data }
                list.cards.sort((a, b) => a.order - b.order)
              }
              break
            }
          }
        }
        return response.data
      } catch (error: any) {
        this.error = error.message || '更新卡片失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateList(id: number, listData: Partial<List>) {
      this.loading = true
      this.error = null
      try {
        const response = await request.put(`/lists/${id}`, listData)
        // 更新所有看板中的对应列表
        for (const board of this.boards) {
          const listIndex = board.lists.findIndex(list => list.id === id)
          if (listIndex !== -1) {
            board.lists[listIndex] = { ...board.lists[listIndex], ...response.data }
          }
        }
        // 更新当前看板中的对应列表
        if (this.currentBoard) {
          const listIndex = this.currentBoard.lists.findIndex(list => list.id === id)
          if (listIndex !== -1) {
            this.currentBoard.lists[listIndex] = { ...this.currentBoard.lists[listIndex], ...response.data }
          }
        }
        return response.data
      } catch (error: any) {
        this.error = error.message || '更新列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateCardOrder(cardId: number, newListId: number, newOrder: number) {
      try {
        await this.updateCard(cardId, { list_id: newListId, order: newOrder })
      } catch (error) {
        console.error('更新卡片顺序失败:', error)
        throw error
      }
    },

    async updateListOrder(listId: number, newOrder: number) {
      try {
        await this.updateList(listId, { order: newOrder })
      } catch (error) {
        console.error('更新列表顺序失败:', error)
        throw error
      }
    },

    // 处理卡片拖拽结束事件
    handleCardDragEnd(event: any) {
      const { to, from, oldIndex, newIndex, draggable } = event
      const cardId = parseInt(draggable.dataset.id)
      const fromListId = parseInt(from.dataset.listId)
      const toListId = parseInt(to.dataset.listId)
      const newCardOrder = newIndex

      if (oldIndex !== newIndex) {
        // 如果卡片移动到了新列表
        if (fromListId !== toListId) {
          // 更新卡片的list_id和order
          this.updateCard(cardId, {
            list_id: toListId,
            order: newCardOrder
          })
        } else {
          // 更新卡片的order
          this.updateCard(cardId, {
            order: newCardOrder
          })
        }

        // 更新新列表中所有卡片的order
        if (this.currentBoard) {
          const toList = this.currentBoard.lists.find(list => list.id === toListId)
          if (toList) {
            toList.cards.forEach((card, index) => {
              this.updateCardOrder(card.id, toListId, index)
            })
          }
        }
      }
    },

    // 处理列表拖拽结束事件
    handleListDragEnd(event: any) {
      const { oldIndex, newIndex } = event
      if (oldIndex !== newIndex && this.currentBoard) {
        // 更新列表顺序
        this.currentBoard.lists.forEach((list, index) => {
          list.order = index
          this.updateListOrder(list.id, index)
        })
      }
    },

    // 初始化Socket.io连接
    initSocket() {
      if (!socket.connected) {
        socket.connect()
      }

      // 监听卡片更新事件
      socket.on('card:updated', (data) => {
        this.handleCardUpdatedEvent(data)
      })

      // 监听列表移动事件
      socket.on('list:moved', (data) => {
        this.handleListMovedEvent(data)
      })
    },

    // 加入看板房间
    joinBoard(boardId: number) {
      if (socket.connected) {
        socket.emit('join_board', boardId)
      }
    },

    // 发送卡片移动事件（用于Socket.io）
    emitCardMoved(card: Card) {
      socket.emit('card:moved', {
        card_id: card.id,
        list_id: card.list_id,
        order: card.order
      })
    },

    // 发送列表移动事件（用于Socket.io）
    emitListMoved(list: List) {
      socket.emit('list:moved', {
        list_id: list.id,
        board_id: list.board_id,
        order: list.order
      })
    },

    // 处理收到的卡片更新事件
    handleCardUpdatedEvent(data: { card: { id: number; title: string; description: string; listId: number; order: number; dueDate?: string; }; timestamp: string }) {
      // 更新所有看板中的对应卡片
      for (const board of this.boards) {
        for (const list of board.lists) {
          const cardIndex = list.cards.findIndex(card => card.id === data.card.id)
          if (cardIndex !== -1) {
            // 如果卡片移动到了其他列表
            if (data.card.listId !== list.id) {
              // 从当前列表删除卡片
              const [movedCard] = list.cards.splice(cardIndex, 1)
              // 找到目标列表并添加卡片
              const targetList = board.lists.find(l => l.id === data.card.listId)
              if (targetList) {
                targetList.cards.push({
                  id: data.card.id,
                  title: data.card.title,
                  description: data.card.description,
                  list_id: data.card.listId,
                  order: data.card.order,
                  due_date: data.card.dueDate
                })
                targetList.cards.sort((a, b) => a.order - b.order)
              }
            } else {
              // 更新当前列表中的卡片
              list.cards[cardIndex] = {
                ...list.cards[cardIndex],
                title: data.card.title,
                description: data.card.description,
                order: data.card.order,
                list_id: data.card.listId,
                due_date: data.card.dueDate
              }
              list.cards.sort((a, b) => a.order - b.order)
            }
            break
          }
        }
      }
    },

    // 处理收到的列表移动事件
    handleListMovedEvent(data: { list_id: number; board_id: number; order: number }) {
      // 更新所有看板中的对应列表
      for (const board of this.boards) {
        if (board.id === data.board_id) {
          const listIndex = board.lists.findIndex(list => list.id === data.list_id)
          if (listIndex !== -1) {
            board.lists[listIndex].order = data.order
            board.lists.sort((a, b) => a.order - b.order)
          }
          break
        }
      }
    }
  }
})
