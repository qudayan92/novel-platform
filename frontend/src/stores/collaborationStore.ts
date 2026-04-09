import { create } from 'zustand'

interface User {
  id: string
  username: string
  displayName: string
  cursor: Cursor | null
  isSelf: boolean
}

interface Cursor {
  position: number
  selection?: {
    start: number
    end: number
  }
}

interface Lock {
  paragraphId: string
  lockedBy: string
  lockedByName: string
  lockedAt: Date
  timeout: number
}

interface RoomInfo {
  id: string
  novelId: string
  name: string
  type: 'chapter' | 'outline' | 'setting' | 'ai'
  createdBy: string
  maxMembers: number
  isActive: boolean
}

interface Member {
  id: string
  roomId: string
  userId: string
  username: string
  role: 'owner' | 'co_writer' | 'editor' | 'setting_manager' | 'reviewer'
  permissions: string[]
  creditLimit: number
  creditUsed: number
  joinedAt: Date
}

interface Operation {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
  oldContent?: string
}

interface WebSocketMessage {
  type: string
  data: any
}

interface CollaborationState {
  // 连接状态
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null

  // 当前房间
  currentRoom: RoomInfo | null
  yourRole: string | null
  yourPermissions: string[]
  yourCredit: { limit: number; used: number; remaining: number }

  // 房间成员
  users: User[]
  members: Member[]

  // 文档状态
  documentVersion: number
  locks: Lock[]

  // WebSocket实例
  socket: WebSocket | null

  // Actions
  connect: (token: string, roomId: string, chapterId?: string) => void
  disconnect: () => void
  joinRoom: (roomId: string, chapterId?: string) => void
  leaveRoom: () => void

  // 文档操作
  sendOperation: (chapterId: string, operation: Operation) => void
  updateCursor: (position: number, selection?: { start: number; end: number }) => void

  // 锁定操作
  acquireLock: (chapterId: string, paragraphId: string) => Promise<{ success: boolean; message?: string }>
  releaseLock: (chapterId: string, paragraphId: string) => void

  // AI操作
  requestAI: (chapterId: string, task: string, content: string, options?: any) => Promise<{ success: boolean; result?: string; error?: string }>

  // 版本操作
  createSnapshot: (chapterId: string, content: string, description?: string) => void
  getHistory: (chapterId: string) => Promise<any[]>
  restoreVersion: (chapterId: string, version: number) => Promise<string | null>

  // 内部Actions
  _setConnected: (connected: boolean) => void
  _setConnecting: (connecting: boolean) => void
  _setError: (error: string | null) => void
  _setRoomState: (state: Partial<CollaborationState>) => void
  _addUser: (user: User) => void
  _removeUser: (userId: string) => void
  _updateUserCursor: (userId: string, cursor: Cursor) => void
  _addLock: (lock: Lock) => void
  _removeLock: (paragraphId: string) => void
  _incrementVersion: () => void
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  currentRoom: null,
  yourRole: null,
  yourPermissions: [],
  yourCredit: { limit: 0, used: 0, remaining: 0 },
  users: [],
  members: [],
  documentVersion: 0,
  locks: [],
  socket: null,

  connect: (token: string, roomId: string, chapterId?: string) => {
    const state = get()
    if (state.socket) {
      state.socket.close()
    }

    set({ isConnecting: true, connectionError: null })

    const ws = new WebSocket(`${WS_URL}?token=${token}`)

    ws.onopen = () => {
      set({ isConnected: true, isConnecting: false, socket: ws })
      get().joinRoom(roomId, chapterId)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message, set, get)
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
      set({ connectionError: '连接错误', isConnecting: false })
    }

    ws.onclose = () => {
      set({ 
        isConnected: false, 
        isConnecting: false,
        currentRoom: null,
        users: [],
        locks: []
      })
    }

    set({ socket: ws })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
    }
    set({
      socket: null,
      isConnected: false,
      currentRoom: null,
      users: [],
      locks: []
    })
  },

  joinRoom: (roomId: string, chapterId?: string) => {
    const { socket, isConnected } = get()
    if (!socket || !isConnected) return

    socket.send(JSON.stringify({
      event: 'join_room',
      data: { roomId, chapterId }
    }))
  },

  leaveRoom: () => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) return

    socket.send(JSON.stringify({
      event: 'leave_room',
      data: { roomId: currentRoom.id }
    }))

    set({
      currentRoom: null,
      users: [],
      locks: [],
      documentVersion: 0
    })
  },

  sendOperation: (chapterId: string, operation: Operation) => {
    const { socket, currentRoom, documentVersion } = get()
    if (!socket || !currentRoom) return

    socket.send(JSON.stringify({
      event: 'document_operation',
      data: {
        roomId: currentRoom.id,
        chapterId,
        operation,
        version: documentVersion
      }
    }))
  },

  updateCursor: (position: number, selection?: { start: number; end: number }) => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) return

    socket.send(JSON.stringify({
      event: 'cursor_update',
      data: {
        roomId: currentRoom.id,
        cursor: { position, selection }
      }
    }))
  },

  acquireLock: async (chapterId: string, paragraphId: string) => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) {
      return { success: false, message: '未连接到房间' }
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data)
          if (message.event === 'acquire_lock_result') {
            socket.removeEventListener('message', handler)
            resolve(message.data)
          }
        } catch {}
      }

      socket.addEventListener('message', handler)

      socket.send(JSON.stringify({
        event: 'acquire_lock',
        data: { roomId: currentRoom.id, chapterId, paragraphId }
      }))

      setTimeout(() => {
        socket.removeEventListener('message', handler)
        resolve({ success: false, message: '获取锁超时' })
      }, 5000)
    })
  },

  releaseLock: (chapterId: string, paragraphId: string) => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) return

    socket.send(JSON.stringify({
      event: 'release_lock',
      data: { roomId: currentRoom.id, chapterId, paragraphId }
    }))
  },

  requestAI: async (chapterId: string, task: string, content: string, options?: any) => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) {
      return { success: false, error: '未连接到房间' }
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data)
          if (message.event === 'ai_request_result') {
            socket.removeEventListener('message', handler)
            resolve(message.data)
          }
        } catch {}
      }

      socket.addEventListener('message', handler)

      socket.send(JSON.stringify({
        event: 'ai_request',
        data: { roomId: currentRoom.id, chapterId, task, content, options }
      }))

      setTimeout(() => {
        socket.removeEventListener('message', handler)
        resolve({ success: false, error: 'AI请求超时' })
      }, 60000)
    })
  },

  createSnapshot: (chapterId: string, content: string, description?: string) => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) return

    socket.send(JSON.stringify({
      event: 'create_snapshot',
      data: { roomId: currentRoom.id, chapterId, content, description }
    }))
  },

  getHistory: async (chapterId: string) => {
    const { socket } = get()
    if (!socket) return []

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data)
          if (message.event === 'history_result') {
            socket.removeEventListener('message', handler)
            resolve(message.data)
          }
        } catch {}
      }

      socket.addEventListener('message', handler)

      socket.send(JSON.stringify({
        event: 'get_history',
        data: { chapterId }
      }))

      setTimeout(() => {
        socket.removeEventListener('message', handler)
        resolve([])
      }, 10000)
    })
  },

  restoreVersion: async (chapterId: string, version: number) => {
    const { socket, currentRoom } = get()
    if (!socket || !currentRoom) return null

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data)
          if (message.event === 'restore_version_result') {
            socket.removeEventListener('message', handler)
            resolve(message.data.content)
          }
        } catch {}
      }

      socket.addEventListener('message', handler)

      socket.send(JSON.stringify({
        event: 'restore_version',
        data: { roomId: currentRoom.id, chapterId, version }
      }))

      setTimeout(() => {
        socket.removeEventListener('message', handler)
        resolve(null)
      }, 10000)
    })
  },

  _setConnected: (connected: boolean) => set({ isConnected: connected }),
  _setConnecting: (connecting: boolean) => set({ isConnecting: connecting }),
  _setError: (error: string | null) => set({ connectionError: error }),
  _setRoomState: (newState) => set(state => ({ ...state, ...newState })),
  _addUser: (user: User) => set(state => ({ users: [...state.users, user] })),
  _removeUser: (userId: string) => set(state => ({
    users: state.users.filter(u => u.id !== userId)
  })),
  _updateUserCursor: (userId: string, cursor: Cursor) => set(state => ({
    users: state.users.map(u => u.id === userId ? { ...u, cursor } : u)
  })),
  _addLock: (lock: Lock) => set(state => {
    const existing = state.locks.findIndex(l => l.paragraphId === lock.paragraphId)
    if (existing >= 0) {
      const newLocks = [...state.locks]
      newLocks[existing] = lock
      return { locks: newLocks }
    }
    return { locks: [...state.locks, lock] }
  }),
  _removeLock: (paragraphId: string) => set(state => ({
    locks: state.locks.filter(l => l.paragraphId !== paragraphId)
  })),
  _incrementVersion: () => set(state => ({ documentVersion: state.documentVersion + 1 }))
}))

function handleMessage(message: WebSocketMessage, set: any, get: any) {
  switch (message.type) {
    case 'room_joined':
      set({
        currentRoom: message.data.room,
        users: message.data.users,
        locks: message.data.locks,
        documentVersion: message.data.version,
        yourRole: message.data.yourRole,
        yourPermissions: message.data.yourPermissions,
        yourCredit: message.data.yourCredit
      })
      break

    case 'user_joined':
      get()._addUser({
        id: message.data.user.id,
        username: message.data.user.username,
        displayName: message.data.user.displayName,
        cursor: null,
        isSelf: false
      })
      break

    case 'user_left':
      get()._removeUser(message.data.userId)
      break

    case 'cursor_update':
      get()._updateUserCursor(message.data.userId, message.data.cursor)
      break

    case 'document_operation':
      get()._incrementVersion()
      break

    case 'lock_acquired':
      get()._addLock({
        paragraphId: message.data.paragraphId,
        lockedBy: message.data.userId,
        lockedByName: message.data.username,
        lockedAt: new Date(message.data.timestamp),
        timeout: 60000
      })
      break

    case 'lock_released':
      get()._removeLock(message.data.paragraphId)
      break

    case 'error':
      set({ connectionError: message.data.message })
      break
  }
}
