import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { collaborationService, RoomMember } from './collaborationService'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

interface User {
  id: string
  username: string
  displayName: string
}

interface ConnectedUser extends User {
  socketId: string
  roomId: string | null
  cursor: Cursor | null
}

interface Cursor {
  position: number
  selection?: {
    start: number
    end: number
  }
}

interface Operation {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
  oldContent?: string
}

interface RoomState {
  roomId: string
  users: Map<string, ConnectedUser>
  documentVersion: number
  locks: Map<string, { userId: string; lockedAt: Date }>
}

export class CollaborationServer {
  private io: Server
  private rooms: Map<string, RoomState> = new Map()
  private userSockets: Map<string, Set<string>> = new Map()

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return next(new Error('认证失败：缺少令牌'))
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        socket.data.userId = decoded.userId
        next()
      } catch (error) {
        next(new Error('认证失败：无效令牌'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`用户连接: ${socket.id}, 用户ID: ${socket.data.userId}`)

      socket.on('join_room', async (data: { roomId: string; chapterId?: string }) => {
        await this.handleJoinRoom(socket, data.roomId, data.chapterId)
      })

      socket.on('leave_room', (roomId: string) => {
        this.handleLeaveRoom(socket, roomId)
      })

      socket.on('document_operation', async (data: {
        roomId: string
        chapterId: string
        operation: Operation
        version: number
      }) => {
        await this.handleDocumentOperation(socket, data)
      })

      socket.on('cursor_update', (data: {
        roomId: string
        cursor: Cursor
      }) => {
        this.handleCursorUpdate(socket, data.roomId, data.cursor)
      })

      socket.on('acquire_lock', async (data: {
        roomId: string
        chapterId: string
        paragraphId: string
      }, callback: (result: { success: boolean; message?: string }) => void) => {
        const result = await this.handleAcquireLock(socket, data.roomId, data.chapterId, data.paragraphId)
        callback(result)
      })

      socket.on('release_lock', async (data: {
        roomId: string
        chapterId: string
        paragraphId: string
      }) => {
        await this.handleReleaseLock(socket, data.roomId, data.chapterId, data.paragraphId)
      })

      socket.on('heartbeat', (roomId: string) => {
        this.handleHeartbeat(socket, roomId)
      })

      socket.on('ai_request', async (data: {
        roomId: string
        chapterId: string
        task: string
        content: string
        options?: any
      }, callback: (result: any) => void) => {
        const result = await this.handleAIRequest(socket, data)
        callback(result)
      })

      socket.on('create_snapshot', async (data: {
        roomId: string
        chapterId: string
        content: string
        description?: string
      }, callback: () => void) => {
        await this.handleCreateSnapshot(socket, data)
        callback()
      })

      socket.on('get_history', async (data: {
        chapterId: string
      }, callback: (versions: any[]) => void) => {
        const versions = await this.handleGetHistory(data.chapterId)
        callback(versions)
      })

      socket.on('restore_version', async (data: {
        roomId: string
        chapterId: string
        version: number
      }, callback: (content: string | null) => void) => {
        const content = await this.handleRestoreVersion(socket, data)
        callback(content)
      })

      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })

      socket.on('error', (error) => {
        console.error(`Socket错误 [${socket.id}]:`, error)
      })
    })
  }

  private async handleJoinRoom(socket: Socket, roomId: string, chapterId?: string) {
    try {
      const userId = socket.data.userId
      
      const member = await collaborationService.getMemberByUserAndRoom(roomId, userId)
      if (!member) {
        socket.emit('error', { message: '您不是该房间的成员' })
        return
      }

      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          roomId,
          users: new Map(),
          documentVersion: 0,
          locks: new Map()
        })
      }

      const roomState = this.rooms.get(roomId)!
      
      const connectedUser: ConnectedUser = {
        id: userId,
        username: member.username,
        displayName: member.displayName || member.username,
        socketId: socket.id,
        roomId,
        cursor: null
      }

      roomState.users.set(socket.id, connectedUser)

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set())
      }
      this.userSockets.get(userId)!.add(socket.id)

      socket.join(roomId)

      await collaborationService.updateLastActive(roomId, userId)

      const locks = await collaborationService.getLocks(roomId, chapterId)

      socket.emit('room_joined', {
        roomId,
        users: Array.from(roomState.users.values()).map(u => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          cursor: u.cursor,
          isSelf: u.socketId === socket.id
        })),
        locks,
        version: roomState.documentVersion,
        yourRole: member.role,
        yourPermissions: member.permissions,
        yourCredit: {
          limit: member.creditLimit,
          used: member.creditUsed,
          remaining: member.creditLimit === -1 ? -1 : member.creditLimit - member.creditUsed
        }
      })

      socket.to(roomId).emit('user_joined', {
        user: {
          id: userId,
          username: member.username,
          displayName: member.displayName || member.username
        },
        timestamp: new Date()
      })

      console.log(`用户 ${member.username} 加入房间 ${roomId}`)
    } catch (error) {
      console.error('加入房间失败:', error)
      socket.emit('error', { message: '加入房间失败' })
    }
  }

  private handleLeaveRoom(socket: Socket, roomId: string) {
    const roomState = this.rooms.get(roomId)
    if (!roomState) return

    const user = roomState.users.get(socket.id)
    if (!user) return

    roomState.users.delete(socket.id)
    socket.leave(roomId)

    if (roomState.users.size === 0) {
      this.rooms.delete(roomId)
    } else {
      socket.to(roomId).emit('user_left', {
        userId: user.id,
        username: user.username,
        timestamp: new Date()
      })
    }

    const userSockets = this.userSockets.get(user.id)
    if (userSockets) {
      userSockets.delete(socket.id)
      if (userSockets.size === 0) {
        this.userSockets.delete(user.id)
      }
    }

    console.log(`用户 ${user.username} 离开房间 ${roomId}`)
  }

  private async handleDocumentOperation(socket: Socket, data: {
    roomId: string
    chapterId: string
    operation: Operation
    version: number
  }) {
    const roomState = this.rooms.get(data.roomId)
    if (!roomState) return

    const user = roomState.users.get(socket.id)
    if (!user) return

    const hasPermission = await collaborationService.checkPermission(
      data.roomId, 
      user.id, 
      'write_content'
    )
    if (!hasPermission) {
      socket.emit('error', { message: '没有编辑权限' })
      return
    }

    if (version !== roomState.documentVersion) {
      socket.emit('version_conflict', {
        currentVersion: roomState.documentVersion,
        yourVersion: version
      })
      return
    }

    roomState.documentVersion++

    await collaborationService.logOperation({
      roomId: data.roomId,
      chapterId: data.chapterId,
      userId: user.id,
      operationType: data.operation.type,
      operationData: data.operation,
      positionStart: data.operation.position,
      positionEnd: data.operation.position + (data.operation.length || data.operation.content?.length || 0),
      version: roomState.documentVersion
    })

    socket.to(data.roomId).emit('document_operation', {
      operation: data.operation,
      userId: user.id,
      username: user.username,
      version: roomState.documentVersion,
      timestamp: new Date()
    })

    socket.emit('operation_ack', {
      version: roomState.documentVersion
    })
  }

  private handleCursorUpdate(socket: Socket, roomId: string, cursor: Cursor) {
    const roomState = this.rooms.get(roomId)
    if (!roomState) return

    const user = roomState.users.get(socket.id)
    if (!user) return

    user.cursor = cursor

    socket.to(roomId).emit('cursor_update', {
      userId: user.id,
      username: user.username,
      cursor,
      timestamp: new Date()
    })
  }

  private async handleAcquireLock(
    socket: Socket, 
    roomId: string, 
    chapterId: string, 
    paragraphId: string
  ): Promise<{ success: boolean; message?: string }> {
    const roomState = this.rooms.get(roomId)
    if (!roomState) {
      return { success: false, message: '房间不存在' }
    }

    const user = roomState.users.get(socket.id)
    if (!user) {
      return { success: false, message: '您不是房间成员' }
    }

    const lockKey = `${chapterId}:${paragraphId}`
    const existingLock = roomState.locks.get(lockKey)

    if (existingLock) {
      const lockAge = Date.now() - existingLock.lockedAt.getTime()
      if (lockAge < 60000 && existingLock.userId !== user.id) {
        return { success: false, message: '该段落已被其他用户锁定' }
      }
    }

    const success = await collaborationService.acquireLock(roomId, chapterId, paragraphId, user.id)

    if (success) {
      roomState.locks.set(lockKey, {
        userId: user.id,
        lockedAt: new Date()
      })

      this.io.to(roomId).emit('lock_acquired', {
        paragraphId,
        chapterId,
        userId: user.id,
        username: user.username,
        timestamp: new Date()
      })

      return { success: true }
    }

    return { success: false, message: '获取锁失败' }
  }

  private async handleReleaseLock(
    socket: Socket, 
    roomId: string, 
    chapterId: string, 
    paragraphId: string
  ) {
    const roomState = this.rooms.get(roomId)
    if (!roomState) return

    const user = roomState.users.get(socket.id)
    if (!user) return

    const lockKey = `${chapterId}:${paragraphId}`
    const lock = roomState.locks.get(lockKey)

    if (lock && lock.userId === user.id) {
      roomState.locks.delete(lockKey)
      await collaborationService.releaseLock(roomId, chapterId, paragraphId, user.id)

      this.io.to(roomId).emit('lock_released', {
        paragraphId,
        chapterId,
        userId: user.id,
        timestamp: new Date()
      })
    }
  }

  private handleHeartbeat(socket: Socket, roomId: string) {
    const roomState = this.rooms.get(roomId)
    if (!roomState) return

    const user = roomState.users.get(socket.id)
    if (!user) return

    collaborationService.updateLastActive(roomId, user.id).catch(console.error)

    const userLocks: string[] = []
    roomState.locks.forEach((lock, key) => {
      if (lock.userId === user.id) {
        userLocks.push(key)
      }
    })

    socket.emit('heartbeat_ack', {
      locks: userLocks,
      timestamp: new Date()
    })
  }

  private async handleAIRequest(socket: Socket, data: {
    roomId: string
    chapterId: string
    task: string
    content: string
    options?: any
  }): Promise<{ success: boolean; result?: string; error?: string; creditUsed?: number }> {
    const roomState = this.rooms.get(data.roomId)
    if (!roomState) {
      return { success: false, error: '房间不存在' }
    }

    const user = roomState.users.get(socket.id)
    if (!user) {
      return { success: false, error: '您不是房间成员' }
    }

    const hasPermission = await collaborationService.checkPermission(
      data.roomId, 
      user.id, 
      'ai_generate'
    )
    if (!hasPermission) {
      return { success: false, error: '没有AI调用权限' }
    }

    const estimatedTokens = Math.ceil(data.content.length / 2) + 500

    const creditCheck = await collaborationService.checkCreditLimit(
      data.roomId, 
      user.id, 
      estimatedTokens
    )
    if (!creditCheck.allowed) {
      return { success: false, error: 'AI额度不足' }
    }

    try {
      const result = await this.executeAITask(data.task, data.content, data.options)
      
      const actualTokens = Math.ceil((data.content.length + result.length) / 2)
      await collaborationService.useCredit(data.roomId, user.id, actualTokens)

      socket.to(data.roomId).emit('ai_generation', {
        userId: user.id,
        username: user.username,
        task: data.task,
        preview: result.substring(0, 100) + '...',
        timestamp: new Date()
      })

      return { 
        success: true, 
        result,
        creditUsed: actualTokens
      }
    } catch (error) {
      console.error('AI任务执行失败:', error)
      return { success: false, error: 'AI任务执行失败' }
    }
  }

  private async executeAITask(task: string, content: string, options?: any): Promise<string> {
    return `[AI ${task}结果] 基于: "${content.substring(0, 50)}..." 的生成内容`
  }

  private async handleCreateSnapshot(socket: Socket, data: {
    roomId: string
    chapterId: string
    content: string
    description?: string
  }) {
    const roomState = this.rooms.get(data.roomId)
    if (!roomState) return

    const user = roomState.users.get(socket.id)
    if (!user) return

    await collaborationService.createSnapshot(
      data.chapterId, 
      data.content, 
      user.id, 
      data.description
    )

    this.io.to(data.roomId).emit('snapshot_created', {
      chapterId: data.chapterId,
      createdBy: user.username,
      description: data.description,
      timestamp: new Date()
    })
  }

  private async handleGetHistory(chapterId: string): Promise<any[]> {
    return collaborationService.getSnapshots(chapterId)
  }

  private async handleRestoreVersion(socket: Socket, data: {
    roomId: string
    chapterId: string
    version: number
  }): Promise<string | null> {
    const roomState = this.rooms.get(data.roomId)
    if (!roomState) return null

    const user = roomState.users.get(socket.id)
    if (!user) return null

    const content = await collaborationService.getSnapshotContent(data.chapterId, data.version)
    
    if (content) {
      this.io.to(data.roomId).emit('version_restored', {
        chapterId: data.chapterId,
        version: data.version,
        restoredBy: user.username,
        timestamp: new Date()
      })
    }

    return content
  }

  private handleDisconnect(socket: Socket) {
    console.log(`用户断开连接: ${socket.id}`)

    this.rooms.forEach((roomState, roomId) => {
      const user = roomState.users.get(socket.id)
      if (user) {
        roomState.users.delete(socket.id)

        socket.to(roomId).emit('user_left', {
          userId: user.id,
          username: user.username,
          reason: 'disconnect',
          timestamp: new Date()
        })

        console.log(`用户 ${user.username} 从房间 ${roomId} 断开`)
      }
    })

    this.userSockets.forEach((sockets, userId) => {
      sockets.delete(socket.id)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    })
  }

  getRoomStats(roomId: string): { userCount: number; version: number } | null {
    const roomState = this.rooms.get(roomId)
    if (!roomState) return null

    return {
      userCount: roomState.users.size,
      version: roomState.documentVersion
    }
  }

  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys())
  }

  broadcastToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data)
  }
}

export function createCollaborationServer(httpServer: HttpServer): CollaborationServer {
  return new CollaborationServer(httpServer)
}
