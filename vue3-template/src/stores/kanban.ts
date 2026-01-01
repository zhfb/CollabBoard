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
}

export const useKanbanStore = defineStore('kanban', {
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

    async createBoard(boardData: Omit<Board, 'id' | 'lists'>) {
      this.loading = true
      this.error = null
      try {
        const response = await request.post('/boards', boardData)
        this.boards.push(response.data)
        this.currentBoard = response.data
        return response.data
      } catch (error: any) {
        this.error = error.message || '创建看板失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateBoard(id: number, boardData: Partial<Board>) {
      this.loading = true
      this.error = null
      try {
        const response = await request.put(`/boards/${id}`, boardData)
        // 更新boards数组中的对应看板
        const index = this.boards.findIndex(board => board.id === id)
        if (index !== -1) {
          this.boards[index] = { ...this.boards[index], ...response.data }
        }
        // 更新当前看板（如果是同一个）
        if (this.currentBoard?.id === id) {
          this.currentBoard = { ...this.currentBoard, ...response.data }
        }
        return response.data
      } catch (error: any) {
        this.error = error.message || '更新看板失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteBoard(id: number) {
      this.loading = true
      this.error = null
      try {
        await request.delete(`/boards/${id}`)
        // 从boards数组中删除对应看板
        this.boards = this.boards.filter(board => board.id !== id)
        // 如果当前看板是被删除的看板，清空当前看板
        if (this.currentBoard?.id === id) {
          this.currentBoard = null
        }
      } catch (error: any) {
        this.error = error.message || '删除看板失败'
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

    // 处理拖拽结束事件
    handleDragEnd(event: any) {
      const { to, from, draggable, oldIndex, newIndex } = event
      
      // 如果是卡片拖拽
      if (draggable.classList.contains('card')) {
        const cardId = parseInt(draggable.dataset.id)
        const fromListId = parseInt(from.dataset.listId)
        const toListId = parseInt(to.dataset.listId)
        
        // 如果卡片移动到了新的列表
        if (fromListId !== toListId) {
          // 找到当前看板
          if (this.currentBoard) {
            // 找到原列表和目标列表
            const fromList = this.currentBoard.lists.find(list => list.id === fromListId)
            const toList = this.currentBoard.lists.find(list => list.id === toListId)
            
            if (fromList && toList) {
              // 从原列表移除卡片
              const [movedCard] = fromList.cards.splice(oldIndex, 1)
              // 添加到目标列表
              movedCard.list_id = toListId
              toList.cards.splice(newIndex, 0, movedCard)
              
              // 更新所有卡片的order
              toList.cards.forEach((card, index) => {
                card.order = index
                this.updateCardOrder(card.id, toListId, index)
              })
              
              // 发送实时更新事件
              this.emitCardMoved(movedCard)
            }
          }
        } else {
          // 卡片在同一列表内移动
          if (this.currentBoard) {
            const list = this.currentBoard.lists.find(list => list.id === fromListId)
            if (list) {
              // 移动卡片
              const [movedCard] = list.cards.splice(oldIndex, 1)
              list.cards.splice(newIndex, 0, movedCard)
              
              // 更新所有卡片的order
              list.cards.forEach((card, index) => {
                card.order = index
                this.updateCardOrder(card.id, fromListId, index)
              })
              
              // 发送实时更新事件
              this.emitCardMoved(movedCard)
            }
          }
        }
      }
      // 如果是列表拖拽
      else if (draggable.classList.contains('list')) {
        const listId = parseInt(draggable.dataset.id)
        
        if (this.currentBoard) {
          // 移动列表
          const [movedList] = this.currentBoard.lists.splice(oldIndex, 1)
          this.currentBoard.lists.splice(newIndex, 0, movedList)
          
          // 更新所有列表的order
          this.currentBoard.lists.forEach((list, index) => {
            list.order = index
            this.updateListOrder(list.id, index)
          })
          
          // 发送实时更新事件
          this.emitListMoved(movedList)
        }
      }
    },

    // 初始化Socket.io连接
    initSocket() {
      if (!socket.connected) {
        socket.connect()
      }

      // 监听卡片移动事件
      socket.on('card:moved', (data) => {
        this.handleCardMovedEvent(data)
      })

      // 监听列表移动事件
      socket.on('list:moved', (data) => {
        this.handleListMovedEvent(data)
      })
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

    // 处理收到的卡片移动事件
    handleCardMovedEvent(data: { card_id: number; list_id: number; order: number }) {
      // 更新所有看板中的对应卡片
      for (const board of this.boards) {
        for (const list of board.lists) {
          const cardIndex = list.cards.findIndex(card => card.id === data.card_id)
          if (cardIndex !== -1) {
            // 如果卡片移动到了其他列表
            if (data.list_id !== list.id) {
              // 从当前列表删除卡片
              const [movedCard] = list.cards.splice(cardIndex, 1)
              // 找到目标列表并添加卡片
              const targetList = board.lists.find(l => l.id === data.list_id)
              if (targetList) {
                movedCard.list_id = data.list_id
                movedCard.order = data.order
                targetList.cards.push(movedCard)
                targetList.cards.sort((a, b) => a.order - b.order)
              }
            } else {
              // 更新当前列表中的卡片
              list.cards[cardIndex].order = data.order
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